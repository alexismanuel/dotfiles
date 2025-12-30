# Dagster GraphQL Queries Reference

GraphQL endpoint: `http://localhost:3000/graphql`

## List Repositories

```graphql
query {
  repositoriesOrError {
    ... on RepositoryConnection {
      nodes {
        name
        location { name }
      }
    }
  }
}
```

## List Jobs

```graphql
query($repoSelector: RepositorySelector!) {
  repositoryOrError(repositorySelector: $repoSelector) {
    ... on Repository {
      jobs { name description }
    }
  }
}
```
Variables: `{"repoSelector": {"repositoryLocationName": "...", "repositoryName": "..."}}`

## List Assets

```graphql
query {
  assetsOrError {
    ... on AssetConnection {
      nodes {
        key { path }
        definition { description groupName }
      }
    }
  }
}
```

## Get Recent Runs

```graphql
query($limit: Int!, $cursor: String) {
  runsOrError(limit: $limit, cursor: $cursor) {
    ... on Runs {
      results {
        runId
        status
        jobName
        startTime
        endTime
      }
    }
  }
}
```

## Get Run Details

```graphql
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
        }
      }
    }
  }
}
```

## Get Run Logs

```graphql
query($runId: ID!) {
  logsForRun(runId: $runId) {
    ... on EventConnection {
      events {
        timestamp
        ... on MessageEvent { message }
        ... on ExecutionStepFailureEvent {
          stepKey
          error { message stack }
        }
        ... on MaterializationEvent {
          assetKey { path }
        }
      }
    }
  }
}
```

## Get Asset Info

```graphql
query($assetKey: AssetKeyInput!) {
  assetOrError(assetKey: $assetKey) {
    ... on Asset {
      key { path }
      definition {
        description
        groupName
        jobNames
        dependencies { asset { assetKey { path } } }
        dependedBy { asset { assetKey { path } } }
      }
      assetMaterializations(limit: 1) {
        runId
        timestamp
      }
    }
  }
}
```
Variables: `{"assetKey": {"path": ["asset_name"]}}`

## Launch Job

```graphql
mutation($executionParams: ExecutionParams!) {
  launchRun(executionParams: $executionParams) {
    ... on LaunchRunSuccess {
      run { runId status }
    }
    ... on RunConfigValidationInvalid {
      errors { message reason }
    }
  }
}
```
Variables:
```json
{
  "executionParams": {
    "selector": {
      "repositoryLocationName": "...",
      "repositoryName": "...",
      "jobName": "..."
    },
    "runConfigData": {}
  }
}
```

## Terminate Run

```graphql
mutation($runId: String!) {
  terminateRun(runId: $runId) {
    ... on TerminateRunSuccess {
      run { runId status }
    }
    ... on TerminateRunFailure { message }
  }
}
```

## Run Statuses

| Status | Meaning |
|--------|---------|
| `QUEUED` | Waiting to start |
| `STARTING` | Initializing |
| `STARTED` | In progress |
| `SUCCESS` | Completed successfully |
| `FAILURE` | Failed |
| `CANCELING` | Being terminated |
| `CANCELED` | Terminated |
