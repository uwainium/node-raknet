pipeline {
  agent any

  tools {nodejs "NodeJS"}

  stages {
    stage('Downloading dependencies') {
      steps {
        sh 'npm install'
      }
    }
  }
}