terraform {
  cloud {
    organization = "notablenomads"

    workspaces {
      tags = ["nn-backend-api"]
    }
  }
} 