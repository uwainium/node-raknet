void setBuildStatus(String message, String state) {
  step([
      $class: "GitHubCommitStatusSetter",
      reposSource: [$class: "ManuallyEnteredRepositorySource", url: env.GIT_URL],
      contextSource: [$class: "ManuallyEnteredCommitContextSource", context: "ci/jenkins/build-status"],
      errorHandlers: [[$class: "ChangingBuildStatusErrorHandler", result: "UNSTABLE"]],
      statusResultSource: [ $class: "ConditionalStatusResultSource", results: [[$class: "AnyBuildResult", message: message, state: state]] ]
  ]);
}

pipeline {
  agent any

  tools {nodejs "NodeJS"}

  stages {
      stage('Downloading Dependencies') {
          steps {
              setBuildStatus("Build started", "PENDING");
              sh 'npm install'
          }
      }
      stage('Tests and Coverage') {
          steps {
              sh 'npm test'
          }
      }
  }

  post {
      success {
          setBuildStatus("Build succeeded", "SUCCESS");
      }
      failure {
          setBuildStatus("Build failed", "FAILURE");
      }
    }
}