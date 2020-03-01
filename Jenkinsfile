pipeline {
  agent any

  tools {nodejs "NodeJS"}

  stages {
    stage('Downloading dependencies') {
      steps {
        sh 'npm install'
      }
    }
    stage('Tests') {
      steps {
        sh 'npm test'
      }
    }
    stage('Coverage') {
      steps {
        sh 'npm coverage'
      }
    }
  }
}