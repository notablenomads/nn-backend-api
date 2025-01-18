terraform {
  cloud {
    organization = "notablenomads"

    workspaces {
      name = "nn-backend-api-${terraform.workspace}"
    }
  }
} 