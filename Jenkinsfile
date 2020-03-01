pipeline {
  agent any

  tools {nodejs "node"}

  stages {
    stage('Downloading dependencies') {
      steps {
        sh 'npm install'
      }
    }
  }
}