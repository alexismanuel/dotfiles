#!/usr/bin/env python3
"""Kubernetes utilities for getting Dagster pod logs."""

import json
import subprocess
from typing import Optional


def run_kubectl(args: list[str], timeout: int = 30) -> dict:
    """Run a kubectl command and return parsed output."""
    try:
        result = subprocess.run(
            ["kubectl"] + args,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        if result.returncode != 0:
            return {"error": result.stderr.strip()}
        return {"output": result.stdout}
    except subprocess.TimeoutExpired:
        return {"error": "kubectl command timed out"}
    except FileNotFoundError:
        return {"error": "kubectl not found in PATH"}


def get_dagster_pods(
    namespace: str = "default",
    label_selector: Optional[str] = None,
) -> dict:
    """List Dagster-related pods."""
    args = ["get", "pods", "-n", namespace, "-o", "json"]
    if label_selector:
        args.extend(["-l", label_selector])
    else:
        # Default: get pods with dagster labels
        args.extend(["-l", "dagster/run_id"])

    result = run_kubectl(args)
    if "error" in result:
        return result

    try:
        data = json.loads(result["output"])
        pods = []
        for item in data.get("items", []):
            meta = item.get("metadata", {})
            status = item.get("status", {})
            pods.append({
                "name": meta.get("name"),
                "namespace": meta.get("namespace"),
                "run_id": meta.get("labels", {}).get("dagster/run_id"),
                "phase": status.get("phase"),
                "start_time": status.get("startTime"),
            })
        return {"pods": pods}
    except json.JSONDecodeError as e:
        return {"error": f"Failed to parse kubectl output: {e}"}


def get_pod_logs_for_run(
    run_id: str,
    namespace: str = "default",
    tail_lines: int = 200,
    container: Optional[str] = None,
) -> dict:
    """Get pod logs for a specific Dagster run."""
    # Find pods with this run_id
    pods_result = get_dagster_pods(
        namespace=namespace,
        label_selector=f"dagster/run_id={run_id}",
    )
    if "error" in pods_result:
        return pods_result

    pods = pods_result.get("pods", [])
    if not pods:
        return {"error": f"No pods found for run_id {run_id}"}

    # Get logs from each pod
    all_logs = {}
    for pod in pods:
        pod_name = pod["name"]
        args = ["logs", pod_name, "-n", namespace, f"--tail={tail_lines}"]
        if container:
            args.extend(["-c", container])

        result = run_kubectl(args)
        if "error" in result:
            all_logs[pod_name] = {"error": result["error"]}
        else:
            all_logs[pod_name] = result["output"]

    return {"run_id": run_id, "logs": all_logs}


def get_pod_logs(
    pod_name: str,
    namespace: str = "default",
    tail_lines: int = 200,
    container: Optional[str] = None,
) -> dict:
    """Get logs from a specific pod."""
    args = ["logs", pod_name, "-n", namespace, f"--tail={tail_lines}"]
    if container:
        args.extend(["-c", container])

    result = run_kubectl(args)
    if "error" in result:
        return result
    return {"pod": pod_name, "logs": result["output"]}


def describe_pod(pod_name: str, namespace: str = "default") -> dict:
    """Get detailed pod description (useful for debugging startup issues)."""
    result = run_kubectl(["describe", "pod", pod_name, "-n", namespace])
    if "error" in result:
        return result
    return {"pod": pod_name, "description": result["output"]}


def get_pod_events(pod_name: str, namespace: str = "default") -> dict:
    """Get events related to a pod."""
    result = run_kubectl([
        "get", "events", "-n", namespace,
        "--field-selector", f"involvedObject.name={pod_name}",
        "-o", "json",
    ])
    if "error" in result:
        return result

    try:
        data = json.loads(result["output"])
        events = []
        for item in data.get("items", []):
            events.append({
                "type": item.get("type"),
                "reason": item.get("reason"),
                "message": item.get("message"),
                "timestamp": item.get("lastTimestamp"),
            })
        return {"pod": pod_name, "events": events}
    except json.JSONDecodeError as e:
        return {"error": f"Failed to parse events: {e}"}


if __name__ == "__main__":
    # Example usage
    print("Dagster pods:", get_dagster_pods())
