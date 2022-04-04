# `@hahnpro/flow-cli`

https://github.com/hahnprojects/flow

```shell
flow-cli --help
flow-cli [command] --help
```

# Commands

## `build [projectName]`

Builds specified Project.

## `install [projectName]`

Installs the dependencies of the specified Project.

## `format`

Formats all typescript files according to prettier configuration.

## `name [projectName]`

Installs Dependencies and Builds the specified Project.

## `package [projectName]`

Builds specified Module and packages it as .zip File for manual upload to the platform.

## `publish-module [projectName]`

Publishes specified Module to Cloud Platform.

- `-f`, `--functions` Publish flow functions.
- `-u`, `--update` Update existing flow functions.

## `publish-functions [projectName]`

Publishes all Flow Functions inside specified Module to Cloud Platform.

- `-u`, `--update` Update existing flow functions.

## `serve [projectName]`

Builds and serves your Project. Rebuilding on file changes.

## `start [projectName]`

Runs your project.

## `test [projectName]`

Runs tests for your Project.

## `generate-schemas [projectName]`

Generates Input, Output and Properties-Schemas for the specified project.

- `--verbose` Output more information about what is being done.
- `-h`, `--hide` Hide warnings if Input/OutputProperties classes can´t be found.
  This command generates the schemas and puts them in the `inputStreams` and `outputStreams`
  fields in the json-files of each Flow-Function. It always assumes the properties defined
  in the `Input/OutPutProperties` classes are meant for the default input/output streams.
  If your Function uses different streams you may have to change stream name manually.
