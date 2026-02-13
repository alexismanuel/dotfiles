#!/usr/bin/env python3
"""Dagster GraphQL client for programmatic interaction with Dagster."""

import json
import urllib.request
import urllib.error
from typing import Any, Optional


class DagsterClient:
    """Client for interacting with Dagster via GraphQL API."""

    def __init__(self, graphql_url: str = "http://localhost:8000/graphql"):
        self.graphql_url = graphql_url

    def _execute(self, query: str, variables: Optional[dict] = None) -> dict:
        """Execute a GraphQL query."""
        payload = json.dumps({"query": query, "variables": variables or {}}).encode()
        req = urllib.request.Request(
            self.graphql_url,
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.URLError as e:
            return {"error": str(e)}

    def list_repositories(self) -> dict:
        """List all available Dagster repositories/code locations."""
        query = """
        query {
          repositoriesOrError {
            ... on RepositoryConnection {
              nodes {
                name
                location { name }
              }
            }
            ... on PythonError { message }
          }
        }
        """
        result = self._execute(query)
        if "errors" in result:
            return {"error": result["errors"][0]["message"]}
        nodes = result.get("data", {}).get("repositoriesOrError", {}).get("nodes", [])
        return {
            "repositories": [
                {"name": r["name"], "location": r["location"]["name"]} for r in nodes
            ]
        }

    def list_jobs(self, repo_location: str, repo_name: str) -> dict:
        """List all jobs in a specific repository."""
        query = """
        query($repoSelector: RepositorySelector!) {
          repositoryOrError(repositorySelector: $repoSelector) {
            ... on Repository {
              jobs { name description }
            }
            ... on RepositoryNotFoundError { message }
            ... on PythonError { message }
          }
        }
        """
        variables = {
            "repoSelector": {
                "repositoryLocationName": repo_location,
                "repositoryName": repo_name,
            }
        }
        result = self._execute(query, variables)
        if "errors" in result:
            return {"error": result["errors"][0]["message"]}
        repo = result.get("data", {}).get("repositoryOrError", {})
        if "message" in repo:
            return {"error": repo["message"]}
        return {"jobs": repo.get("jobs", [])}

    def list_assets(self, repo_location: str = None, repo_name: str = None) -> dict:
        """List all assets, optionally filtered by repository."""
        query = """
        query {
          assetsOrError {
            ... on AssetConnection {
              nodes {
                key { path }
                definition {
                  description
                  groupName
                }
              }
            }
            ... on PythonError { message }
          }
        }
        """
        result = self._execute(query)
        if "errors" in result:
            return {"error": result["errors"][0]["message"]}
        nodes = result.get("data", {}).get("assetsOrError", {}).get("nodes", [])
        assets = []
        for node in nodes:
            asset = {
                "key": "/".join(node.get("key", {}).get("path", [])),
                "description": node.get("definition", {}).get("description"),
                "group": node.get("definition", {}).get("groupName"),
            }
            assets.append(asset)
        return {"assets": assets}

    def get_recent_runs(self, limit: int = 10) -> dict:
        """Get recent Dagster runs."""
        query = """
        query($limit: Int!) {
          runsOrError(limit: $limit) {
            ... on Runs {
              results {
                runId
                status
                jobName
                startTime
                endTime
              }
            }
            ... on PythonError { message }
          }
        }
        """
        result = self._execute(query, {"limit": limit})
        if "errors" in result:
            return {"error": result["errors"][0]["message"]}
        runs = result.get("data", {}).get("runsOrError", {}).get("results", [])
        return {"runs": runs}

    def get_run_info(self, run_id: str) -> dict:
        """Get detailed information about a specific run."""
        query = """
        query($runId: ID!) {
          runOrError(runId: $runId) {
            ... on Run {
              runId
              status
              jobName
              startTime
              endTime
              runConfigYaml
              stats {
                ... on RunStatsSnapshot {
                  stepsSucceeded
                  stepsFailed
                  startTime
                  endTime
                }
              }
            }
            ... on RunNotFoundError { message }
            ... on PythonError { message }
          }
        }
        """
        result = self._execute(query, {"runId": run_id})
        if "errors" in result:
            return {"error": result["errors"][0]["message"]}
        run = result.get("data", {}).get("runOrError", {})
        if "message" in run:
            return {"error": run["message"]}
        return run

    def get_run_logs(self, run_id: str, limit: int = 100) -> dict:
        """Get event logs for a specific run."""
        query = """
        query($runId: ID!) {
          logsForRun(runId: $runId) {
            ... on EventConnection {
              events {
                timestamp
                ... on MessageEvent { message }
                ... on ExecutionStepStartEvent { stepKey }
                ... on ExecutionStepSuccessEvent { stepKey }
                ... on ExecutionStepFailureEvent {
                  stepKey
                  error { message stack }
                }
                ... on MaterializationEvent {
                  assetKey { path }
                }
              }
            }
            ... on PythonError { message }
          }
        }
        """
        result = self._execute(query, {"runId": run_id})
        if "errors" in result:
            return {"error": result["errors"][0]["message"]}
        logs = result.get("data", {}).get("logsForRun", {})
        if "message" in logs:
            return {"error": logs["message"]}
        return {"events": logs.get("events", [])}

    def get_asset_info(self, asset_key: str) -> dict:
        """Get detailed information about a specific asset."""
        query = """
        query($assetKey: AssetKeyInput!) {
          assetOrError(assetKey: $assetKey) {
            ... on Asset {
              key { path }
              definition {
                description
                groupName
                jobNames
                dependedBy { asset { assetKey { path } } }
                dependencies { asset { assetKey { path } } }
              }
              assetMaterializations(limit: 1) {
                runId
                timestamp
              }
            }
            ... on AssetNotFoundError { message }
          }
        }
        """
        key_parts = asset_key.split("/")
        result = self._execute(query, {"assetKey": {"path": key_parts}})
        if "errors" in result:
            return {"error": result["errors"][0]["message"]}
        asset = result.get("data", {}).get("assetOrError", {})
        if "message" in asset:
            return {"error": asset["message"]}
        defn = asset.get("definition", {})
        mats = asset.get("assetMaterializations", [])
        return {
            "key": "/".join(asset.get("key", {}).get("path", [])),
            "description": defn.get("description"),
            "group": defn.get("groupName"),
            "jobs": defn.get("jobNames", []),
            "upstream": [
                "/".join(d["asset"]["assetKey"]["path"])
                for d in defn.get("dependencies", [])
            ],
            "downstream": [
                "/".join(d["asset"]["assetKey"]["path"])
                for d in defn.get("dependedBy", [])
            ],
            "last_materialization": mats[0] if mats else None,
        }

    def launch_job(
        self,
        repo_location: str,
        repo_name: str,
        job_name: str,
        run_config: Optional[dict] = None,
    ) -> dict:
        """Launch a Dagster job run."""
        query = """
        mutation($executionParams: ExecutionParams!) {
          launchRun(executionParams: $executionParams) {
            ... on LaunchRunSuccess {
              run { runId status }
            }
            ... on RunConfigValidationInvalid {
              errors { message reason }
            }
            ... on PythonError { message }
          }
        }
        """
        variables = {
            "executionParams": {
                "selector": {
                    "repositoryLocationName": repo_location,
                    "repositoryName": repo_name,
                    "jobName": job_name,
                },
                "runConfigData": run_config or {},
            }
        }
        result = self._execute(query, variables)
        if "errors" in result:
            return {"error": result["errors"][0]["message"]}
        launch = result.get("data", {}).get("launchRun", {})
        if "errors" in launch:
            return {"error": launch["errors"][0]["message"]}
        if "message" in launch:
            return {"error": launch["message"]}
        return launch.get("run", {})

    def materialize_asset(
        self, asset_key: str, repo_location: str, repo_name: str
    ) -> dict:
        """Materialize a specific asset."""
        # First get the job that materializes this asset
        asset_info = self.get_asset_info(asset_key)
        if "error" in asset_info:
            return asset_info
        jobs = asset_info.get("jobs", [])
        if not jobs:
            return {"error": f"No job found to materialize asset {asset_key}"}
        # Launch the asset job
        return self.launch_job(repo_location, repo_name, jobs[0])

    def terminate_run(self, run_id: str) -> dict:
        """Terminate an in-progress run."""
        query = """
        mutation($runId: String!) {
          terminateRun(runId: $runId) {
            ... on TerminateRunSuccess {
              run { runId status }
            }
            ... on TerminateRunFailure { message }
            ... on RunNotFoundError { message }
            ... on PythonError { message }
          }
        }
        """
        result = self._execute(query, {"runId": run_id})
        if "errors" in result:
            return {"error": result["errors"][0]["message"]}
        term = result.get("data", {}).get("terminateRun", {})
        if "message" in term:
            return {"error": term["message"]}
        return term.get("run", {})


if __name__ == "__main__":
    # Example usage
    client = DagsterClient()
    print("Repositories:", client.list_repositories())
    print("Recent runs:", client.get_recent_runs(limit=5))
