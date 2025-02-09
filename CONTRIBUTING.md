# Contributing to Notable Nomads Backend API

First off, thank you for considering contributing to Notable Nomads Backend API! It's people like you that make Notable Nomads such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps which reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed after following the steps
- Explain which behavior you expected to see instead and why
- Include screenshots if possible

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When you are creating an enhancement suggestion, please include:

- Use a clear and descriptive title
- Provide a step-by-step description of the suggested enhancement
- Provide specific examples to demonstrate the steps
- Describe the current behavior and explain which behavior you expected to see instead
- Explain why this enhancement would be useful

### Pull Requests

- Fill in the required template
- Do not include issue numbers in the PR title
- Follow the TypeScript styleguide
- Include thoughtfully-worded, well-structured tests
- Document new code
- End all files with a newline

## Development Process

1. Fork the repo
2. Create a new branch from `main`
3. Make your changes
4. Run the tests
5. Push to your fork and submit a pull request

### Setting up your environment

1. Install Node.js (version >= 18)
2. Install Docker and Docker Compose
3. Clone your fork
4. Install dependencies: `yarn install`
5. Copy `.env.example` to `.env` and configure
6. Start the development server: `yarn start:dev`

### Testing

```bash
# Run unit tests
yarn test

# Run e2e tests
yarn test:e2e

# Run test coverage
yarn test:cov
```

### Style Guide

- Use TypeScript
- Follow the existing code style
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused
- Use dependency injection
- Follow SOLID principles

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code
- refactor: A code change that neither fixes a bug nor adds a feature
- perf: A code change that improves performance
- test: Adding missing tests or correcting existing tests
- chore: Changes to the build process or auxiliary tools

### Documentation

- Keep README.md up to date
- Document all new features
- Update API documentation
- Add JSDoc comments to all functions

## Project Structure

```
src/
├── app/                # Application modules
│   ├── ai-chat/       # AI chat functionality
│   ├── auth/          # Authentication
│   ├── blog/          # Blog functionality
│   ├── core/          # Core functionality
│   └── email/         # Email functionality
├── config/            # Configuration
├── database/          # Database migrations
└── main.ts           # Application entry point
```

## Questions?

Feel free to contact us if you have any questions about contributing.
