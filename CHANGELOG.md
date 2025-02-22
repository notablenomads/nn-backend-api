# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.8.58](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.55...v0.8.58) (2025-02-22)

### Bug Fixes

- **cors:** Simplify CORS configuration and logging for production environment ([d743835](https://github.com/Notable-Nomads/nn-backend-api/commit/d7438355ba494076fc05a392ac1368dd4cf6bb40))

### [0.8.57](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.55...v0.8.57) (2025-02-22)

### [0.8.56](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.55...v0.8.56) (2025-02-17)

### [0.8.55](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.54...v0.8.55) (2025-02-17)

### Features

- **database:** Update existingProjectChallenges enum in leads migration ([09f24b2](https://github.com/Notable-Nomads/nn-backend-api/commit/09f24b2c1ecee0e33af29b22563c13cbe8e386bb))
- **lead:** Enhance lead service with new project challenges and mobile app platform formatting ([a602138](https://github.com/Notable-Nomads/nn-backend-api/commit/a602138c8744913dd66d3de29138a1c1fd14f07b))

### [0.8.54](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.53...v0.8.54) (2025-02-17)

### Bug Fixes

- **tests:** Correct naming convention for InjectRepository mock in lead service tests ([69310a5](https://github.com/Notable-Nomads/nn-backend-api/commit/69310a517ed1ecd952f6b151afdf0a544f6332aa))

### [0.8.53](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.52...v0.8.53) (2025-02-17)

### Features

- **aws:** Add AwsModule to configure SESClient with AWS credentials ([946e615](https://github.com/Notable-Nomads/nn-backend-api/commit/946e6155eeb18d569ed06577821018fe66fb670b))
- **database:** Add mobile app platform and AI/ML dataset status fields to leads migration ([f2b2abb](https://github.com/Notable-Nomads/nn-backend-api/commit/f2b2abb82c4608cde54c99c4b490c4f23c7dd601))
- **lead:** Add mobile app platform and AI/ML dataset status fields to lead DTO and entity ([6de84f4](https://github.com/Notable-Nomads/nn-backend-api/commit/6de84f48b1bf5361081b520224731c01ff6307cf))
- **lead:** Update lead entity to support multiple existing project challenges and enhance validation logic ([a7844f5](https://github.com/Notable-Nomads/nn-backend-api/commit/a7844f55d1a4c8441b3fef92518e53fc2ec9f928))

### [0.8.52](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.51...v0.8.52) (2025-02-16)

### [0.8.51](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.50...v0.8.51) (2025-02-14)

### Features

- **logging:** Enhance LoggingInterceptor to skip logging for health check requests and improve request logging logic ([0373340](https://github.com/Notable-Nomads/nn-backend-api/commit/0373340c7a79c2cc610cb1ed163685eedc8b8b2e))

### [0.8.50](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.49...v0.8.50) (2025-02-14)

### Features

- **logging:** Simplify logging structure by removing unused fields and enhancing log action types ([a209503](https://github.com/Notable-Nomads/nn-backend-api/commit/a2095031681e5cb0ddbd5ad292d113dbf5ee6ac3))

### [0.8.49](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.48...v0.8.49) (2025-02-14)

### Features

- **auth:** Enhance token handling with improved error logging and user action tracking ([a9f1ac0](https://github.com/Notable-Nomads/nn-backend-api/commit/a9f1ac0a5c3b306d542ec9b866a1b2ffd64766ad))
- **logging:** Add correlation ID middleware and logging interceptor with enhanced logging capabilities ([e011e34](https://github.com/Notable-Nomads/nn-backend-api/commit/e011e34c87a0c3409e0154593a46ebfa74b609ea))
- **logging:** Add migration for log_entries table and associated enums ([fd15941](https://github.com/Notable-Nomads/nn-backend-api/commit/fd159417d241b6d6ea4ca4f392397a2308aaf7c1))
- **logging:** Implement logging module and integrate with user and auth services ([775f335](https://github.com/Notable-Nomads/nn-backend-api/commit/775f335c517383796312ec7edfdc190aba4cb9cc))
- **logging:** Refactor getLogs method to use GetLogsDto for improved query handling and add role-based access control ([c776379](https://github.com/Notable-Nomads/nn-backend-api/commit/c77637903365b77ff35be929e2ade44368a7c41d))

### [0.8.48](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.47...v0.8.48) (2025-02-14)

### Features

- Enhance validation messages and constraints in contact and lead DTOs ([35250b0](https://github.com/Notable-Nomads/nn-backend-api/commit/35250b0dc603c2439e3cbcae8bc5624d5e933b8b))

### [0.8.47](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.46...v0.8.47) (2025-02-14)

### Bug Fixes

- Databse required environment variables for production startup checks ([4cf993a](https://github.com/Notable-Nomads/nn-backend-api/commit/4cf993a6499db9fcb52686fff013be93814220bc))

### [0.8.46](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.45...v0.8.46) (2025-02-14)

### Features

- Refactor production environment settings and enhance security checks ([3e1214c](https://github.com/Notable-Nomads/nn-backend-api/commit/3e1214c5e20b7f30efb2ba2bc866d49ba1c37677))

### [0.8.45](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.44...v0.8.45) (2025-02-13)

### Features

- Enable global cache in Yarn configuration for improved performance ([06366d2](https://github.com/Notable-Nomads/nn-backend-api/commit/06366d2121d9779ae59d2e4c0057da04f44451e4))
- Enhance health checks with database, disk, and memory indicators ([27037db](https://github.com/Notable-Nomads/nn-backend-api/commit/27037dbdb9709e12b54b1b8d7bef2ed492ca900b))
- Enhance nginx configuration for improved SSL handling and proxy settings ([65575d2](https://github.com/Notable-Nomads/nn-backend-api/commit/65575d2467f2a3a730d821f5163cedec78a78102))
- Update nginx configuration for production deployment and improve volume management ([86ffde4](https://github.com/Notable-Nomads/nn-backend-api/commit/86ffde4f285b9333ddbfed3d9da2f2e0722acfae))
- Update PostgreSQL configuration in Docker Compose for improved health checks ([178c3d3](https://github.com/Notable-Nomads/nn-backend-api/commit/178c3d3f90d27f5382a71bb7151aae00a98f5317))

### Bug Fixes

- Update nginx configuration script to escape variables for proper parsing ([702031d](https://github.com/Notable-Nomads/nn-backend-api/commit/702031ddb56e6f16a92cd0a85b8f701d2d129763))

### [0.8.44](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.43...v0.8.44) (2025-02-13)

### Features

- Add Docker Compose configurations for local and production environments ([3cd57e5](https://github.com/Notable-Nomads/nn-backend-api/commit/3cd57e58aa2f147b64887773fbc3de977e92e6e2))

### [0.8.43](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.42...v0.8.43) (2025-02-13)

### Features

- Add database configuration validation to environment schema ([9d8ea2d](https://github.com/Notable-Nomads/nn-backend-api/commit/9d8ea2d497f74de2b7e35cb2ee3ac5e922b2c4b8))

### [0.8.42](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.41...v0.8.42) (2025-02-13)

### Features

- Update AI model to use tuned version for improved performance ([37703f7](https://github.com/Notable-Nomads/nn-backend-api/commit/37703f7770e132c586b2a27e6b385df0b5187224))

### [0.8.41](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.40...v0.8.41) (2025-02-12)

### [0.8.40](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.39...v0.8.40) (2025-02-12)

### Features

- Enhance logging and error handling in AI chat service and gateway ([2aa59cb](https://github.com/Notable-Nomads/nn-backend-api/commit/2aa59cbd7149b4c998906d1c9ff0ddf312f4d7d8))
- Improve blog service to handle single and multiple RSS items and add debug logging ([e776a0e](https://github.com/Notable-Nomads/nn-backend-api/commit/e776a0e06f7fe26584c3dd7a2ec53ce656d6940e))
- Update CORS settings to allow additional domains for development ([a8b90cc](https://github.com/Notable-Nomads/nn-backend-api/commit/a8b90cc3b2bb731f99631f27f142b55893c05513))

### [0.8.39](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.38...v0.8.39) (2025-02-12)

### [0.8.38](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.37...v0.8.38) (2025-02-12)

### Bug Fixes

- Update AI model to use 'gemini-2.0-flash-001' ([7baaae1](https://github.com/Notable-Nomads/nn-backend-api/commit/7baaae1ff176c3d185facfc45e389d25b7d86793))

### [0.8.37](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.36...v0.8.37) (2025-02-12)

### [0.8.36](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.35...v0.8.36) (2025-02-12)

### Features

- Add CLI module and command to create super admin user ([43a9531](https://github.com/Notable-Nomads/nn-backend-api/commit/43a9531c4c5982766a81c7b7deb201e263c1871e))

### [0.8.35](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.34...v0.8.35) (2025-02-12)

### Bug Fixes

- Update CORS logging in production to warn instead of error ([c27f31a](https://github.com/Notable-Nomads/nn-backend-api/commit/c27f31a803dfa1fd507c97fa760d5950642fde3c))

### [0.8.34](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.33...v0.8.34) (2025-02-12)

### Bug Fixes

- Simplify Swagger documentation enabling logic in main.ts ([3fe3980](https://github.com/Notable-Nomads/nn-backend-api/commit/3fe398014e4fce8d2f682ed58131b4d85a68e34c))
- Update environment variable handling in manage-env script and configuration ([33b1863](https://github.com/Notable-Nomads/nn-backend-api/commit/33b18633e6a15a6b4b5756d93324f7ae9b73aa30))

### [0.8.33](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.32...v0.8.33) (2025-02-12)

### Features

- Add SSH tunnel script for production database access and enhance migration for refresh tokens ([3c06503](https://github.com/Notable-Nomads/nn-backend-api/commit/3c06503039946f2424ec49e1f886a76fdf865284))

### [0.8.32](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.31...v0.8.32) (2025-02-12)

### Features

- Add API header documentation for x-api-key in rotateApiKey endpoint ([4b591be](https://github.com/Notable-Nomads/nn-backend-api/commit/4b591be568ad77c9d3d2fbf701d0cd1059dedf70))
- Add branch name extraction to deployment workflow ([de90f38](https://github.com/Notable-Nomads/nn-backend-api/commit/de90f38157e871a6eaf4bb90b3f42c5a80067c1f))
- Add JWT authentication and role-based access control to lead retrieval endpoints ([a5d1414](https://github.com/Notable-Nomads/nn-backend-api/commit/a5d1414b29784aa875880dfd52d0cf5d0799a98a))
- Implement user creation and update functionality with DTOs and authentication guards ([2d7f8fa](https://github.com/Notable-Nomads/nn-backend-api/commit/2d7f8fa7a3490396e29dd26cc45cce31021d399d))
- Integrate caching for API key validation and enhance key rotation logging ([d0d3955](https://github.com/Notable-Nomads/nn-backend-api/commit/d0d395598c41822d76315aa649210db0e57c4bbb))
- Update API key controller path and add Postman environment files for development and production ([f9e105f](https://github.com/Notable-Nomads/nn-backend-api/commit/f9e105fd8708574b413c32b3cf1f5201571d3a56))
- Update refresh token entity to allow nullable fields and add migration for schema changes ([8cfd336](https://github.com/Notable-Nomads/nn-backend-api/commit/8cfd33657d07a3a8e7d8dd807ce44a4f6a4dc00b))

### Bug Fixes

- Correct username and medium URL format for Milad Ghamati in BlogService ([c96ef0c](https://github.com/Notable-Nomads/nn-backend-api/commit/c96ef0c44229bf8063df22c829a3b0a81a156b38))

### [0.8.31](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.30...v0.8.31) (2025-02-11)

### Features

- Add ApiKeyController to manage API key operations ([09531c8](https://github.com/Notable-Nomads/nn-backend-api/commit/09531c8a6eecd0086b314a69624045b3a50c566c))
- Add CLI command to create super admin and update user roles to use enum ([6deae80](https://github.com/Notable-Nomads/nn-backend-api/commit/6deae802bbc70d3faa385eece88a79dfe80173a9))
- Add migration to implement roles as enum for users ([6dee7ab](https://github.com/Notable-Nomads/nn-backend-api/commit/6dee7ab65e2ee3944e2440be16233d4ce3f223bd))
- Add new author profile for Milad Ghamati in blog service ([55eb7e5](https://github.com/Notable-Nomads/nn-backend-api/commit/55eb7e5442dc0fa0196450f5f5bf2802aed33a38))
- Enhance API key validation by allowing multiple active keys and apply API key guard to Lead controller ([45b3e28](https://github.com/Notable-Nomads/nn-backend-api/commit/45b3e285416ffdbbda41a96d7145225e6832601e))
- Enhance super admin existence check using array contains operator ([0c3f6b9](https://github.com/Notable-Nomads/nn-backend-api/commit/0c3f6b9214861efebd8a79467b80361e70ecccfc))
- Implement API key management with generation, rotation, and deactivation functionalities ([62507d6](https://github.com/Notable-Nomads/nn-backend-api/commit/62507d6908c7b6b7045bf21f11027fd81f519738))
- Implement role-based access control for API key management ([887d49b](https://github.com/Notable-Nomads/nn-backend-api/commit/887d49bbf0d5b1df0c8eda0f2f2318ad8f49bd85))
- Improve API key validation logic by optimizing database queries and enhancing error handling ([99392f2](https://github.com/Notable-Nomads/nn-backend-api/commit/99392f2bd21ddb7bfc5beab49f4ede62ab09c075))
- Refactor API key extraction to use custom header and apply API key guard to email controller ([088b70d](https://github.com/Notable-Nomads/nn-backend-api/commit/088b70d140b970a5ef9c671b4386382e4e60a529))
- Refactor super admin creation to a standalone script and remove CLI command ([0370fbe](https://github.com/Notable-Nomads/nn-backend-api/commit/0370fbe88897b2adfb2df73f870b70884d20fa76))
- Restrict API key generation and deactivation to Super Admin only; enhance JWT guard for user role validation ([137f3e6](https://github.com/Notable-Nomads/nn-backend-api/commit/137f3e6804a732fbb45a0c0093cb0097943eac03))
- Update migration scripts to specify output directory for generated migrations ([6a6161d](https://github.com/Notable-Nomads/nn-backend-api/commit/6a6161d3ba14322d8b50535239249ff8f627cb80))
- Update super admin creation script to enforce single super admin policy and enhance security notes ([fcc3d45](https://github.com/Notable-Nomads/nn-backend-api/commit/fcc3d45ae28c81ad72dd5c8abc002ad3f2a39241))
- Update super admin creation script to require email argument and use environment variable for password; enhance API key validation logic ([07f5fc6](https://github.com/Notable-Nomads/nn-backend-api/commit/07f5fc6aa9bb0098d48379cf6fe6cc82616cbfb8))

### [0.8.30](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.29...v0.8.30) (2025-02-11)

### [0.8.29](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.28...v0.8.29) (2025-02-11)

### [0.8.28](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.27...v0.8.28) (2025-02-11)

### [0.8.27](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.25...v0.8.27) (2025-02-11)

### Bug Fixes

- Update minimum length requirement for project description to 10 characters ([be9863f](https://github.com/Notable-Nomads/nn-backend-api/commit/be9863f1f73aa95bdfeb87f72d598de1cd407abe))

### [0.8.26](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.25...v0.8.26) (2025-02-11)

### Bug Fixes

- Update minimum length requirement for project description to 10 characters ([be9863f](https://github.com/Notable-Nomads/nn-backend-api/commit/be9863f1f73aa95bdfeb87f72d598de1cd407abe))

### [0.8.25](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.24...v0.8.25) (2025-02-11)

### [0.8.24](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.23...v0.8.24) (2025-02-11)

### Features

- Update script and connect sources in security headers to include localhost for development ([c46d83d](https://github.com/Notable-Nomads/nn-backend-api/commit/c46d83da1909dbf006ee021c34ad10177e54a15c))

### [0.8.23](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.22...v0.8.23) (2025-02-10)

### Features

- Enhance throttling configuration and tracking for improved rate limiting ([741f6c8](https://github.com/Notable-Nomads/nn-backend-api/commit/741f6c8a2576fd00639626e8c722e6e51f7ddf8c))
- Update script and connect sources in security headers to include new domain ([aca3aaf](https://github.com/Notable-Nomads/nn-backend-api/commit/aca3aaf13ac03581fd445b581944eb2e94a9b02d))

### [0.8.22](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.21...v0.8.22) (2025-02-10)

### Features

- Add compression middleware and its type definitions to enhance response performance ([ae66ff5](https://github.com/Notable-Nomads/nn-backend-api/commit/ae66ff5c103bb8e523f726aabdcfa0f800390e5d))
- Add security configuration with rate limiting, helmet settings, and input validation ([33d4128](https://github.com/Notable-Nomads/nn-backend-api/commit/33d4128a309cd2b671a680dfd61aaaa94e498de4))
- Refactor security headers for improved clarity and organization ([ae57f59](https://github.com/Notable-Nomads/nn-backend-api/commit/ae57f59b822646b8d115a9c6327a21cac98e2e0a))
- Update environment configuration and enhance security measures during logout ([88cce8a](https://github.com/Notable-Nomads/nn-backend-api/commit/88cce8a28d278c314ff6d0e2c4b8dbac78bb6094))

### [0.8.21](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.20...v0.8.21) (2025-02-10)

### [0.8.20](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.19...v0.8.20) (2025-02-10)

### [0.8.19](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.18...v0.8.19) (2025-02-09)

### Features

- Improve CORS configuration with domain trimming, production checks, and centralized options ([2f8ae29](https://github.com/Notable-Nomads/nn-backend-api/commit/2f8ae29b36eac9d7898d8f76e883c8061cd2aea0))

### [0.8.18](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.17...v0.8.18) (2025-02-09)

### [0.8.17](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.15...v0.8.17) (2025-02-09)

### Features

- Add request size middleware and enhance security headers in the application ([81f5aca](https://github.com/Notable-Nomads/nn-backend-api/commit/81f5aca3a8e86728e9948adedd9e60739be2941f))
- Enhance authentication and error handling with token expiration check and rate limiting for error logging ([11773f8](https://github.com/Notable-Nomads/nn-backend-api/commit/11773f83c670aa98aa1c2549b1ae38e7aaa666f3))
- Implement security middleware to block access to sensitive paths and enhance app security ([d44e21b](https://github.com/Notable-Nomads/nn-backend-api/commit/d44e21b8755f0f95621662d8a2dac508a9988fe0))
- Implement token blacklist service and enhance authentication flow with token revocation ([a4d60d5](https://github.com/Notable-Nomads/nn-backend-api/commit/a4d60d58fe78f39f96cbd2eec9013f971674c8ad))

### [0.8.16](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.15...v0.8.16) (2025-02-09)

### Features

- Add request size middleware and enhance security headers in the application ([81f5aca](https://github.com/Notable-Nomads/nn-backend-api/commit/81f5aca3a8e86728e9948adedd9e60739be2941f))
- Implement security middleware to block access to sensitive paths and enhance app security ([d44e21b](https://github.com/Notable-Nomads/nn-backend-api/commit/d44e21b8755f0f95621662d8a2dac508a9988fe0))
- Implement token blacklist service and enhance authentication flow with token revocation ([a4d60d5](https://github.com/Notable-Nomads/nn-backend-api/commit/a4d60d58fe78f39f96cbd2eec9013f971674c8ad))

### [0.8.15](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.14...v0.8.15) (2025-02-09)

### Features

- update Node.js version to 22 and configure Corepack and Yarn in workflows ([f24f526](https://github.com/Notable-Nomads/nn-backend-api/commit/f24f52688dd898623d2d64b50d7f5136b0733964))

### [0.8.14](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.13...v0.8.14) (2025-02-09)

### Features

- enhance release script to auto-update changelog and version tag ([64d30a2](https://github.com/Notable-Nomads/nn-backend-api/commit/64d30a2b6dcbd1ee2cdf48172ae6eea06baea97a))
- simplify commit and pre-commit hooks, update release script for all commits ([c0c54f7](https://github.com/Notable-Nomads/nn-backend-api/commit/c0c54f730b3c90fdb7ea70ef7b26a4cc6412937b))

### [0.8.13](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.12...v0.8.13) (2025-02-09)

### Features

- add commit message validation and linting configuration ([c43b304](https://github.com/Notable-Nomads/nn-backend-api/commit/c43b30460abe251dbd0845f9558ac9deb4400f3b))

### [0.8.12](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.11...v0.8.12) (2025-02-09)

### Features

- enhance project configuration and security measures ([12d9681](https://github.com/Notable-Nomads/nn-backend-api/commit/12d9681fe4f7653fdea4cb849ee537a044a2826c))

### [0.8.11](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.10...v0.8.11) (2025-02-09)

### Features

- **backup:** add database backup script with error handling and compression ([6a21981](https://github.com/Notable-Nomads/nn-backend-api/commit/6a21981883f12ed607705bc7b7cce6f913a800cd))
- **migration:** create leads table with necessary fields and foreign key constraint ([f9d5824](https://github.com/Notable-Nomads/nn-backend-api/commit/f9d5824758ce13b013f86284be4dc5058751d484))

### [0.8.10](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.9...v0.8.10) (2025-02-09)

### Features

- **auth:** add wasUsed property to refresh tokens and implement token reuse detection ([1b9bcfd](https://github.com/Notable-Nomads/nn-backend-api/commit/1b9bcfdd9b536fc54204c2575e10985be33c5c53))
- **auth:** enhance logout functionality with token validation and improve response messages ([7d6b02d](https://github.com/Notable-Nomads/nn-backend-api/commit/7d6b02d750bc51fc3bb1d81815f94f40e4f56ae1))
- **auth:** enhance refresh token entity with JoinColumn and update user relationship ([aa1e50f](https://github.com/Notable-Nomads/nn-backend-api/commit/aa1e50f4b941b10ac79f11fc7e7d728f573e4749))
- **auth:** implement encryption for refresh tokens and refine database structure ([fda69ee](https://github.com/Notable-Nomads/nn-backend-api/commit/fda69ee9d1a33e89b6f69bb7ae46e445bc3adf2a))
- **auth:** implement refresh token functionality and cleanup service ([d2fdb9b](https://github.com/Notable-Nomads/nn-backend-api/commit/d2fdb9bedbff61a11d756d959419242dbba01c5e))
- **auth:** limit active refresh tokens per user and implement token removal ([01a6f84](https://github.com/Notable-Nomads/nn-backend-api/commit/01a6f84a171547651a01d44f4712356d564f85ec))
- **auth:** refactor user and refresh token relationship, remove refreshToken column from users ([33e7e08](https://github.com/Notable-Nomads/nn-backend-api/commit/33e7e0896787c2d9b147b2efdd05562e89396f4b))
- **auth:** remove user relation from token retrieval and return payload in JWT strategy ([1d3c39a](https://github.com/Notable-Nomads/nn-backend-api/commit/1d3c39a34d4516631c601cc0018ea6b370179f8c))
- **auth:** update refresh token endpoint to accept DTO and validate user identity ([92984d2](https://github.com/Notable-Nomads/nn-backend-api/commit/92984d2873586e11efb52234daadc6bf7ff1286c))
- **cleanup:** enhance cleanup script to exclude postgres data and improve SSL certificate handling ([a662dd7](https://github.com/Notable-Nomads/nn-backend-api/commit/a662dd7919a42f8b40e06852ac798de6e21101cf))
- **docker:** add encryption key to environment variables and fix volume declaration ([9e4da6f](https://github.com/Notable-Nomads/nn-backend-api/commit/9e4da6f9797ce0ce8c4585d195883fc9a7a89c9d))

### [0.8.9](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.8...v0.8.9) (2025-02-09)

### Features

- **docker:** add Sentry DSN and monitoring memory threshold to docker-compose ([ef7b69c](https://github.com/Notable-Nomads/nn-backend-api/commit/ef7b69ca6b4d6fb8fcadc55c01f1ce3c45c1dccc))

### [0.8.8](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.7...v0.8.8) (2025-02-09)

### Features

- **auth:** add user registration endpoint with validation and conflict handling ([cd47636](https://github.com/Notable-Nomads/nn-backend-api/commit/cd47636c99f5844d31146575094d4dd2ced59c04))
- **auth:** implement JWT authentication with user management and refresh token support ([d7edd18](https://github.com/Notable-Nomads/nn-backend-api/commit/d7edd18e5445008c4e45cfad9e4558adf1030983))
- **auth:** implement login attempt tracking and secure token generation ([04b9092](https://github.com/Notable-Nomads/nn-backend-api/commit/04b9092b0d9666046cd4659ebe70862a29f3c0bd))
- **config:** add JWT configuration with secret and expiration settings ([bbb4953](https://github.com/Notable-Nomads/nn-backend-api/commit/bbb4953436fe1fd5cdb19237bd7d1e6c7d166bf7))
- **docker:** add JWT configuration to docker-compose ([0493f80](https://github.com/Notable-Nomads/nn-backend-api/commit/0493f8002ec558c5ae07d7294e1a9fd957dbd89f))
- **monitoring:** add memory threshold configuration and enhance data sanitization ([314b4ba](https://github.com/Notable-Nomads/nn-backend-api/commit/314b4bac7f2d2305b6fab2ef188898c176adf1ea))
- **monitoring:** enhance data sanitization with depth and size limits for metrics ([ee6f9c1](https://github.com/Notable-Nomads/nn-backend-api/commit/ee6f9c10dffc36bb845d82044f7400bc7e671ce4))

### [0.8.7](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.5...v0.8.7) (2025-02-09)

### Features

- **monitoring:** add performance monitoring and health check services ([bb294f5](https://github.com/Notable-Nomads/nn-backend-api/commit/bb294f506a63d69d8861e1b1d9e051f00e33e644))
- **monitoring:** integrate Sentry for error tracking and performance monitoring ([a98da21](https://github.com/Notable-Nomads/nn-backend-api/commit/a98da212e6afd959bfd547fe5c347080dfae9fca))

### [0.8.6](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.5...v0.8.6) (2025-02-09)

### [0.8.5](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.4...v0.8.5) (2025-02-06)

### [0.8.4](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.3...v0.8.4) (2025-02-06)

### [0.8.3](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.2...v0.8.3) (2025-02-06)

### Features

- enhance throttling configuration for email and lead routes ([4dcfc62](https://github.com/Notable-Nomads/nn-backend-api/commit/4dcfc6218e59dec6bfafea2105332cd81d27cfc7))

### [0.8.2](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.1...v0.8.2) (2025-02-06)

## [0.8.1](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.8.0...v0.8.1) (2025-02-06)

# [0.8.0](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.7.0...v0.8.0) (2025-02-06)

### Bug Fixes

- temporarily disable error messages in production environment ([7190f3d](https://github.com/Notable-Nomads/nn-backend-api/commit/7190f3d169389d7dacf5d95fabf49249d8a86078))

### Features

- enhance error handling in email and blog services, and add custom validation pipe and response interceptor ([ca11b52](https://github.com/Notable-Nomads/nn-backend-api/commit/ca11b52c220c88f7fbc6767b656ed52c031dfc75))
- implement error handling module and integrate error management in lead validation and controller ([99b4b9a](https://github.com/Notable-Nomads/nn-backend-api/commit/99b4b9a5083fb3888e6aef00af9ed7498ad34ab3))
- implement lead validation service and refactor lead controller for improved data validation ([3c49fbf](https://github.com/Notable-Nomads/nn-backend-api/commit/3c49fbf726e0e0adba7ee997a2105ee8cec088fd))
- improve blog service error handling and enhance feed parsing logic ([6057047](https://github.com/Notable-Nomads/nn-backend-api/commit/60570476bff6e1dfc999ec13573944c3edc7c86c))
- refactor error handling to streamline error creation and improve consistency across services ([078dbb4](https://github.com/Notable-Nomads/nn-backend-api/commit/078dbb4afccc4573feb10928d2fedfe752524b5b))
- update LeadDto to use ApiPropertyOptional and adjust validation for project description ([6d1e593](https://github.com/Notable-Nomads/nn-backend-api/commit/6d1e593ba9da02e23f99445d96572194364f7c01))

# [0.7.0](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.6.9...v0.7.0) (2025-02-06)

### Features

- enhance LeadDto validation and error handling in LeadController ([9ca84ab](https://github.com/Notable-Nomads/nn-backend-api/commit/9ca84ab234d25e433452d62ca8f84313891bffa1))

## [0.6.9](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.6.8...v0.6.9) (2025-02-04)

## [0.6.8](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.6.7...v0.6.8) (2025-02-04)

## [0.6.7](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.6.6...v0.6.7) (2025-02-04)

## [0.6.6](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.6.5...v0.6.6) (2025-02-04)

## [0.6.5](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.6.4...v0.6.5) (2025-02-03)

## [0.6.4](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.6.2...v0.6.4) (2025-02-03)

### Bug Fixes

- correct logic for CORS restriction configuration ([9345f6a](https://github.com/Notable-Nomads/nn-backend-api/commit/9345f6a066fe4bbba5a35f01da899fc91efc5119))

## [0.6.3](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.6.2...v0.6.3) (2025-02-02)

## [0.6.2](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.6.1...v0.6.2) (2025-02-02)

## [0.6.1](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.6.0...v0.6.1) (2025-02-02)

# [0.6.0](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.5.0...v0.6.0) (2025-02-02)

### Features

- simplify release workflow by removing unnecessary steps and enhancing GitHub release creation ([86f0180](https://github.com/Notable-Nomads/nn-backend-api/commit/86f01807a44d8fc4ecbee40b7ba2bba1b50a9992))

# [0.5.0](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.4.0...v0.5.0) (2025-02-02)

### Features

- add frontend service and update SSL management for multiple domains ([5caabfc](https://github.com/Notable-Nomads/nn-backend-api/commit/5caabfcb58c96cfc94f346760c2860f080beb3a9))
- enhance CORS service with improved logging and domain matching logic ([ca49160](https://github.com/Notable-Nomads/nn-backend-api/commit/ca49160138e659d7c27b32e5e403ff3443309a2c))
- update Content Security Policy for enhanced security and API access ([560e094](https://github.com/Notable-Nomads/nn-backend-api/commit/560e0947b69bb59c71b7038b5e20608cbef46d3f))
- update CORS restriction logic in configuration ([feff3f2](https://github.com/Notable-Nomads/nn-backend-api/commit/feff3f23137bcc459c8da331023da1d205a354b8))
- update frontend domain in deployment and SSL management scripts ([db0c1f9](https://github.com/Notable-Nomads/nn-backend-api/commit/db0c1f97991fea5b410070d796589200b66e07e2))
- update Nginx configuration for improved security and Cloudflare integration ([aa3fd6b](https://github.com/Notable-Nomads/nn-backend-api/commit/aa3fd6b00366525be4357f87d27a17e6d7c950d8))
- update Nginx configuration for SSL management and server name adjustments ([49af718](https://github.com/Notable-Nomads/nn-backend-api/commit/49af71827b48e4ebe89a865659a102b81edb2f38))

# [0.4.0](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.3.0...v0.4.0) (2025-02-02)

### Features

- **release:** enhance CHANGELOG extraction and improve release notes formatting ([0152ed0](https://github.com/Notable-Nomads/nn-backend-api/commit/0152ed06589e2e154621faa39f003429a1b4dd36))

# [0.3.0](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.2.0...v0.3.0) (2025-02-02)

### Features

- **release:** improve CHANGELOG extraction and format release title ([efcc94a](https://github.com/Notable-Nomads/nn-backend-api/commit/efcc94a62f1ab1df840b971590eaba9d3d2e9b70))

# [0.2.0](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.1.9...v0.2.0) (2025-02-02)

### Features

- **ci:** add release workflow and update deployment triggers ([2c150d5](https://github.com/Notable-Nomads/nn-backend-api/commit/2c150d5aef4f789202f482a72ffd8025e26bcbd0))
- **ci:** add verification for required files and secrets in deployment workflow ([3a8b81c](https://github.com/Notable-Nomads/nn-backend-api/commit/3a8b81c5e48aa45801e1abeb67f2d14e4856e709))
- **ci:** enhance deployment workflow with production env file and Docker image build ([fa0466b](https://github.com/Notable-Nomads/nn-backend-api/commit/fa0466b349b0d1c74b432a714a6d0b8f5c4fd1ad))
- **ci:** enhance release workflow with version verification and failure notifications ([cf87227](https://github.com/Notable-Nomads/nn-backend-api/commit/cf87227ea4826eaa3d76c9922cbab12bab0efc63))
- **ci:** improve deployment workflow with timeout, health checks, and enhanced logging ([607c966](https://github.com/Notable-Nomads/nn-backend-api/commit/607c9667b5a5d7de25e9856c16b5fdf97be046e2))
- **ci:** modify dependency installation command in release workflow ([54d1e2b](https://github.com/Notable-Nomads/nn-backend-api/commit/54d1e2bf0e4455bd8192e30c89422a9ce62ad586))
- **ci:** restructure deployment workflow with verification steps for files and secrets ([e35565c](https://github.com/Notable-Nomads/nn-backend-api/commit/e35565c84d2291139a7bcd13a8b9dbbc78c58bb9))
- **ci:** simplify dependency installation in release workflow ([35e80ef](https://github.com/Notable-Nomads/nn-backend-api/commit/35e80ef37611f48dfde3b0b2cdc5352e45b3be6a))
- **ci:** specify Yarn version and enhance dependency installation process ([d424334](https://github.com/Notable-Nomads/nn-backend-api/commit/d42433468c37d76d2ac131b28f5e2d01bc110cd6))
- **ci:** update release workflow to enable Corepack and improve dependency installation ([ab4b8e1](https://github.com/Notable-Nomads/nn-backend-api/commit/ab4b8e1c16abfe79931c1685730be1abcadbdf9d))
- **config:** add support for enabling Swagger documentation via environment variable ([570b604](https://github.com/Notable-Nomads/nn-backend-api/commit/570b604eeff951bf86593baa4247f9a92826ce9d))
- **config:** improve Swagger documentation logging and setup ([c0365d0](https://github.com/Notable-Nomads/nn-backend-api/commit/c0365d030628c6a58134ad1b2a6fe061e72e422b))
- **config:** update Swagger documentation enablement logic and default value ([a6d7278](https://github.com/Notable-Nomads/nn-backend-api/commit/a6d72781b1caa88a0e1f040d04c0b87349528049))
- **database:** update TypeORM configuration and add initial migration for leads table ([133607a](https://github.com/Notable-Nomads/nn-backend-api/commit/133607a47f19f27a7686bd2f046185c105f40024))
- **docker:** enhance Docker setup with migration execution and build verification ([ce766d8](https://github.com/Notable-Nomads/nn-backend-api/commit/ce766d8b84d4587fae5227aadd23312d52268ab6))
- **docker:** simplify production dependency installation in Dockerfile ([d0a5a39](https://github.com/Notable-Nomads/nn-backend-api/commit/d0a5a392fba15233d2e2c0756166242a254cfbd4))
- **lead:** add lead options DTO and endpoint for retrieving form options ([0a97f4e](https://github.com/Notable-Nomads/nn-backend-api/commit/0a97f4eaee066ca1470ecf8484a725abdfc398f2))
- **lead:** implement endpoint to retrieve available options for the lead form ([c40ab36](https://github.com/Notable-Nomads/nn-backend-api/commit/c40ab369fb155b6edc19f840bb9095c3e8191b3e))

### [0.1.9](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.0.13...v0.1.9) (2025-01-31)

### Features

- **certbot:** add configuration files for ACME staging environment ([b92cc3e](https://github.com/Notable-Nomads/nn-backend-api/commit/b92cc3ea3e2865469a68cd9ce18ccbabd305d757))
- **dev:** add development script and update docker-compose for environment configuration ([a3dbc75](https://github.com/Notable-Nomads/nn-backend-api/commit/a3dbc7576fe1b52420b0ed666d6ca28c4ec2c21d))
- **docker:** enhance docker-compose with additional environment variables for configuration ([e782f78](https://github.com/Notable-Nomads/nn-backend-api/commit/e782f78799662ddd7cc9c7d26c2f1a15eb9ed0c1))
- **docker:** simplify nginx service configuration and update deployment script for directory creation ([559bedd](https://github.com/Notable-Nomads/nn-backend-api/commit/559beddbb0549749cd1b545886ac90562730b6dd))
- **docker:** update docker-compose and deployment script for improved nginx configuration and health checks ([95b3ecd](https://github.com/Notable-Nomads/nn-backend-api/commit/95b3ecd95985e8e841cfc8c376cb88ad2508333c))
- **docker:** update docker-compose for environment variable support ([895a667](https://github.com/Notable-Nomads/nn-backend-api/commit/895a6670b5bede54eb46b29084c757baccc260f9))
- **env:** add example environment configuration and update docker-compose for dynamic variables ([abd9a78](https://github.com/Notable-Nomads/nn-backend-api/commit/abd9a78f60115f86495cbe99825e00e7b558bb56))
- **lead:** add lead module with controller, service, and DTO for project submissions ([aeb4741](https://github.com/Notable-Nomads/nn-backend-api/commit/aeb4741c41ea99e00218d2decf47e231a3bb3fe3))
- **lead:** add LeadEmailTemplateHelper for generating email templates ([5ae4fe7](https://github.com/Notable-Nomads/nn-backend-api/commit/5ae4fe7dbc6ea7199fdeee7d98cc5a5b20b3277e))
- **lead:** implement database configuration and add lead retrieval endpoints ([c2036f6](https://github.com/Notable-Nomads/nn-backend-api/commit/c2036f61cd97c816d2d20f13ab09e3cfc6d60377))

### Bug Fixes

- **ai-chat:** update API key retrieval and model configuration ([69707a5](https://github.com/Notable-Nomads/nn-backend-api/commit/69707a52915d662fe40566e10402598ed2cec217))

### [0.1.8](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.1.7...v0.1.8) (2025-01-29)

### [0.1.7](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.1.6...v0.1.7) (2025-01-29)

### [0.1.6](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.1.5...v0.1.6) (2025-01-25)

### Features

- add environment file creation step to GitHub Actions deployment workflow ([c476402](https://github.com/Notable-Nomads/nn-backend-api/commit/c47640268275b0d20555bf9a8dc349ef92a40d3a))
- add GitHub Actions workflow for staging deployment ([656c20f](https://github.com/Notable-Nomads/nn-backend-api/commit/656c20ffb23fc94fee1e2345fb343b53ca3e2bd8))
- add Yarn configuration step to GitHub Actions deployment workflow ([71ba637](https://github.com/Notable-Nomads/nn-backend-api/commit/71ba637bd53263a17f3f8c6b53f6ed4281e2d50a))
- enhance DNS verification and deployment scripts ([a033f69](https://github.com/Notable-Nomads/nn-backend-api/commit/a033f69b80cb208c39afef3a66d8063ffd8fc0ed))
- enhance GitHub Actions deployment workflow ([c260216](https://github.com/Notable-Nomads/nn-backend-api/commit/c260216d0a7108bb5a791272b86e9708cb4f3a20))
- enhance security and performance configurations ([c673851](https://github.com/Notable-Nomads/nn-backend-api/commit/c6738514fa684b9f527ad9ebef08315af76974ad)), closes [#123](https://github.com/Notable-Nomads/nn-backend-api/issues/123)
- enhance SSH configuration in GitHub Actions deployment workflow ([15da46e](https://github.com/Notable-Nomads/nn-backend-api/commit/15da46ead3022a955d1bfa4da94af8265116f276))
- enhance WebSocket support and Nginx configuration ([db6b12c](https://github.com/Notable-Nomads/nn-backend-api/commit/db6b12c3ea32d83f98e63705417078d3995a1647))
- improve Nginx configuration for WebSocket support ([d4ab297](https://github.com/Notable-Nomads/nn-backend-api/commit/d4ab297d1475d5d1337660635f234b9eb3f3bee1))
- update Nginx configuration and Docker Compose for improved performance ([ad65807](https://github.com/Notable-Nomads/nn-backend-api/commit/ad65807d3c478d44b6313d074438af1e0be78fb6))

### [0.1.5](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.1.3...v0.1.5) (2025-01-20)

### Features

- add certbot service and update nginx configuration for SSL certificate management ([58cb32b](https://github.com/Notable-Nomads/nn-backend-api/commit/58cb32b40a5777fe9e04ddb4a057dd004cf2eaba))
- add command availability checks for Docker, SSH, SCP, and DNS utilities in deployment scripts ([f7d0d00](https://github.com/Notable-Nomads/nn-backend-api/commit/f7d0d00e17df008ba093bf4360e51a09f75725e0))
- add GitHub Actions workflow for automated production deployment ([b5c666e](https://github.com/Notable-Nomads/nn-backend-api/commit/b5c666e07ee304aa22a1bf859e4bb109478e410a))
- add nginx configuration and enhance SSL setup script for improved deployment ([7abc6c6](https://github.com/Notable-Nomads/nn-backend-api/commit/7abc6c6a23827bc1aa159e9b3a425b08de9b968c))
- add setup script for GitHub Actions SSH key deployment ([f66ed95](https://github.com/Notable-Nomads/nn-backend-api/commit/f66ed959c5f2ad4a4751c706fdbd938d4043f681))
- enhance deployment script and configurations for SSL setup and reliability ([36761e1](https://github.com/Notable-Nomads/nn-backend-api/commit/36761e17d6b101bed4b1ee9f6fa32cee2cd14620))
- enhance deployment script with Docker installation checks and improved error handling ([647b46d](https://github.com/Notable-Nomads/nn-backend-api/commit/647b46debfe556a84a0f5864bdcb9de7a44661cc))
- enhance docker-compose and deployment scripts for improved configuration and health checks ([7c8d56c](https://github.com/Notable-Nomads/nn-backend-api/commit/7c8d56c76becbb6108d02439df7abab752ff7dd0))
- enhance SSL management in deployment process ([c9b13ae](https://github.com/Notable-Nomads/nn-backend-api/commit/c9b13ae7d10aa1b227efabd769e6adeb4458d518))
- enhance SSL setup script with validation and backup features ([e93ab54](https://github.com/Notable-Nomads/nn-backend-api/commit/e93ab54ee7c6ea2bb7aeae2d9008a08d845b2c2c))
- implement new deployment workflow with enhanced scripts and SSL setup ([a8d739a](https://github.com/Notable-Nomads/nn-backend-api/commit/a8d739af7a7fb2529d79528fe7190019908cbdf2))
- overhaul deployment process with enhanced scripts and configurations ([d04ebd7](https://github.com/Notable-Nomads/nn-backend-api/commit/d04ebd7abca73ed60dfd0602b6ec15507f7e5687))

### Bug Fixes

- update domain references in deployment scripts and configurations ([49056f8](https://github.com/Notable-Nomads/nn-backend-api/commit/49056f84f241a2c4486bf46ab1b0886994611e1b))

### [0.1.4](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.1.3...v0.1.4) (2025-01-20)

### Features

- enhance deployment script and configurations for SSL setup and reliability ([36761e1](https://github.com/Notable-Nomads/nn-backend-api/commit/36761e17d6b101bed4b1ee9f6fa32cee2cd14620))
- enhance SSL setup script with validation and backup features ([e93ab54](https://github.com/Notable-Nomads/nn-backend-api/commit/e93ab54ee7c6ea2bb7aeae2d9008a08d845b2c2c))

### Bug Fixes

- update domain references in deployment scripts and configurations ([49056f8](https://github.com/Notable-Nomads/nn-backend-api/commit/49056f84f241a2c4486bf46ab1b0886994611e1b))

### [0.1.3](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.0.14...v0.1.3) (2025-01-20)

### Features

- enhance deployment process with Docker Hub integration and server configuration ([cb0265d](https://github.com/Notable-Nomads/nn-backend-api/commit/cb0265d9a56eb1ef924a9c1fae643573d2b999fc))
- implement comprehensive SSL setup script for secure deployment ([e2bc99d](https://github.com/Notable-Nomads/nn-backend-api/commit/e2bc99dc99e1f178fd8caf106a32527144f0973d))

### [0.0.14](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.0.13...v0.0.14) (2025-01-19)

### Features

- add deployment scripts and configurations for nn-backend-api ([053f1d5](https://github.com/Notable-Nomads/nn-backend-api/commit/053f1d598b4f5ba56b579ad052ac4fd2fcb04aad))

### [0.0.13](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.0.12...v0.0.13) (2025-01-18)

### Features

- add default ECR repository URL to production variables ([33c66d8](https://github.com/Notable-Nomads/nn-backend-api/commit/33c66d824df2fd8a9cf81d1a864f4255624d808f))
- add Terraform cloud configuration and remove S3 backend for production and staging environments ([22b5e3f](https://github.com/Notable-Nomads/nn-backend-api/commit/22b5e3f94e65d924edfd62985885b1a6085e7bbf))
- enhance production and shared environment configurations ([984157e](https://github.com/Notable-Nomads/nn-backend-api/commit/984157ebaa787ce5d98a29572c69c5a7f8d2c313))
- enhance production environment configuration with new variables and SSM parameter updates ([e139c57](https://github.com/Notable-Nomads/nn-backend-api/commit/e139c577fe93a2b831147a2139d2f821c44958d1))
- enhance staging environment configuration and EC2 module ([ab5971e](https://github.com/Notable-Nomads/nn-backend-api/commit/ab5971ed7f8ae2b61b37748388ce5efa95e32270))
- implement Terraform Cloud configuration and enhance shared environment setup ([2086c8c](https://github.com/Notable-Nomads/nn-backend-api/commit/2086c8cc0a342204015d5f5611b946a2e320e242))

### [0.0.12](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.0.11...v0.0.12) (2025-01-18)

### Features

- add parent_zone_id variable and update EC2 launch template configuration ([8680685](https://github.com/Notable-Nomads/nn-backend-api/commit/8680685d087ba74098e703363272e181b8783c75))
- add SSM parameters for environment variables and secrets in staging ([3512fd4](https://github.com/Notable-Nomads/nn-backend-api/commit/3512fd46064d13abb6d10d0a7f87c3e1f7a405e2))
- enhance API deployment with improved health checks and IAM permissions ([cbc21df](https://github.com/Notable-Nomads/nn-backend-api/commit/cbc21dfe921746f74369615203b0c3065472d08d))
- enhance EC2 module with configurable instance type and SSM parameter overwrite ([5787cb9](https://github.com/Notable-Nomads/nn-backend-api/commit/5787cb94810742f5480d1758a3f0a54af8483072))
- enhance EC2 module with improved IAM policies and logging configuration ([ebbfded](https://github.com/Notable-Nomads/nn-backend-api/commit/ebbfded20b14412929d6d749fe7ee9851664fbd5))
- enhance IAM policies for EC2 instance access to ECR and SSM parameters ([3eef85a](https://github.com/Notable-Nomads/nn-backend-api/commit/3eef85adde833f64e37d8c8880a02c9241bf5415))
- implement EC2-based API deployment and enhance DNS management ([44bd637](https://github.com/Notable-Nomads/nn-backend-api/commit/44bd637a2f771ab6349e735f504b28bdea35929d))
- refactor DNS management and add SSM parameters for environment variables in production ([ba5392c](https://github.com/Notable-Nomads/nn-backend-api/commit/ba5392c306ab623c6ed25394b93e20e17f0c640b))
- update AI chat service to use default API key and adjust validation schema ([98452ff](https://github.com/Notable-Nomads/nn-backend-api/commit/98452ff474acc64331826f9cc2a25262a6fe2732))
- update production outputs and remove SSM parameter overwrite option ([1362138](https://github.com/Notable-Nomads/nn-backend-api/commit/1362138206a160d16435e22ace9f9c32e9eb9757))
- update SSM parameter configuration for staging environment ([e45a479](https://github.com/Notable-Nomads/nn-backend-api/commit/e45a479f18630436a0a43df4bc71580c341b723f))
- update SSM parameter handling and IAM policies for EC2 module ([37e4893](https://github.com/Notable-Nomads/nn-backend-api/commit/37e4893c9ce8297d44dd0b8de4e97a51adcde251))
- update SSM parameters for staging environment ([b0a97cb](https://github.com/Notable-Nomads/nn-backend-api/commit/b0a97cb0b86497f10e46937f62115b78155a56f5))

### [0.0.11](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.0.10...v0.0.11) (2025-01-17)

### Features

- add DNS management module and update API configuration for platform subdomain ([ac515de](https://github.com/Notable-Nomads/nn-backend-api/commit/ac515decd5672920c0a9d7106c58526c013534f2))
- add environment variables to API module in staging configuration ([1706ea6](https://github.com/Notable-Nomads/nn-backend-api/commit/1706ea65ad692526a60a60b70d495637f544af87))
- add new environment variables and update health check settings for API module ([1612e5c](https://github.com/Notable-Nomads/nn-backend-api/commit/1612e5c11830f698b749ab3f5cd41b19322df267))
- add NS record for platform subdomain and update zone_id variable in production and staging environments ([d7c71f8](https://github.com/Notable-Nomads/nn-backend-api/commit/d7c71f873356766072e0fdb2f1a4fac0a86079b9))
- add production environment configuration and API module setup ([e0e5b5f](https://github.com/Notable-Nomads/nn-backend-api/commit/e0e5b5f09ea2e34871371d449adf58d22f4f6447))
- add staging environment configuration for Terraform ([49649ca](https://github.com/Notable-Nomads/nn-backend-api/commit/49649ca8be92fb8e5b6175fcc20e3d076ab01fba))
- enhance API module and staging environment configuration ([d39e3ab](https://github.com/Notable-Nomads/nn-backend-api/commit/d39e3ab662583edea2da0ef2faa271237793501b))
- enhance production environment configuration for API module ([ad05f5e](https://github.com/Notable-Nomads/nn-backend-api/commit/ad05f5e0ce5966070e977cc5b7f66f41f584e164))
- enhance staging environment configuration for Terraform ([7d54ae4](https://github.com/Notable-Nomads/nn-backend-api/commit/7d54ae4cd993f48843fb954b69921976c4633211))
- optimize API module configurations and logging settings for production and staging environments ([2c32658](https://github.com/Notable-Nomads/nn-backend-api/commit/2c3265806539c86771897d91855011cce81afa34))
- optimize resource allocation and logging for production and staging environments ([b5e47c9](https://github.com/Notable-Nomads/nn-backend-api/commit/b5e47c9fdd62d630909ad787fd325327f98ebff2))
- refine API and production environment manifests for cost efficiency and health check improvements ([293d582](https://github.com/Notable-Nomads/nn-backend-api/commit/293d582686fcbdbe9fe5665b912f5bacd1a6ed27))
- update API and production environment manifests for enhanced health checks and cost efficiency ([4248dc6](https://github.com/Notable-Nomads/nn-backend-api/commit/4248dc6ddc799f04e064c16f92fed3b28f75bf2c))
- update Terraform configuration for production environment ([7e35ca3](https://github.com/Notable-Nomads/nn-backend-api/commit/7e35ca30e7917f60fa59e72302325cb181b0e982))

### Bug Fixes

- update ECR repository URL in production Terraform configuration ([24bbe19](https://github.com/Notable-Nomads/nn-backend-api/commit/24bbe195fae6173b75fe6d6c57943a78ded3728a))

### [0.0.10](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.0.9...v0.0.10) (2025-01-16)

### Features

- enhance email template styles and structure for improved compatibility ([43cbdff](https://github.com/Notable-Nomads/nn-backend-api/commit/43cbdffb7a494866cd7efc05c2b0eb481ee80965))
- enhance error handling and logging across services ([441e3a0](https://github.com/Notable-Nomads/nn-backend-api/commit/441e3a00e7c72c70728328c68ed7a2718833a1cd))
- update API and production environment manifests for improved health checks and cost optimization ([786e5a9](https://github.com/Notable-Nomads/nn-backend-api/commit/786e5a958a023ef83ef4fc70a9983eeedf97d4b7))

### Bug Fixes

- update email service logo handling and template integration ([1058a94](https://github.com/Notable-Nomads/nn-backend-api/commit/1058a9486b68a3e9442796b1a4e6730e93f4ddb9))

### [0.0.9](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.0.8...v0.0.9) (2025-01-16)

### [0.0.8](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.0.7...v0.0.8) (2025-01-16)

### Features

- add buildspec and manifest files for nn-backend-api-main pipeline ([ff6d885](https://github.com/Notable-Nomads/nn-backend-api/commit/ff6d8852efebca5ee134c983931f196fda94b93c))
- add manifest.yml for API service configuration ([cf66dc9](https://github.com/Notable-Nomads/nn-backend-api/commit/cf66dc908f63785cd36fdaf9b05ff7c2f3f7c106))
- add manifest.yml for production environment ([cae18c7](https://github.com/Notable-Nomads/nn-backend-api/commit/cae18c710e0386348dfc38e95766250365643024))
- add manifest.yml for production environment ([1c4c867](https://github.com/Notable-Nomads/nn-backend-api/commit/1c4c867e04c20da5d2bd5e018fc90557cf319b71))
- add workspace and API service manifest for platform configuration ([21a8dbf](https://github.com/Notable-Nomads/nn-backend-api/commit/21a8dbf255b717d9fca51c420f546769192dce8d))
- enhance API and production environment manifests with health check configurations ([7dc4bf8](https://github.com/Notable-Nomads/nn-backend-api/commit/7dc4bf86c4de05488b64f860894f70c862de3e85))
- update API service manifest to include secrets configuration ([7596137](https://github.com/Notable-Nomads/nn-backend-api/commit/759613702235573c02f167dd0f22eb465ff05175))
- update API service manifest with build arguments and secrets configuration ([7017343](https://github.com/Notable-Nomads/nn-backend-api/commit/701734362fb1b1f55546a3623c2c3c786ca5f420))
- update email service to load logo dynamically and enhance nest-cli configuration ([d756eda](https://github.com/Notable-Nomads/nn-backend-api/commit/d756edae8914c8b70673ec359ec95226409897f2))

### Bug Fixes

- correct repository URL in nn-backend-api main pipeline manifest ([5043f12](https://github.com/Notable-Nomads/nn-backend-api/commit/5043f12308c11b3b7e5ef35cb681597ccc22f69e))

### [0.0.7](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.0.6...v0.0.7) (2025-01-15)

### Features

- add manifest.yml for API service and update WebSocket URLs ([9f8b740](https://github.com/Notable-Nomads/nn-backend-api/commit/9f8b74062b48688881dfc516cb435d9b64cab3fe))
- add new manifests for API service and production environment ([40eb1b2](https://github.com/Notable-Nomads/nn-backend-api/commit/40eb1b2a94268b119155c9d49f7e36f0010c8efa))
- add secrets configuration to API service manifest.yml ([765e3db](https://github.com/Notable-Nomads/nn-backend-api/commit/765e3db87a7cdd2c29e0f347b1af5de1c1f04b81))
- enhance API service manifest with environment variables and staging/production settings ([b74c34a](https://github.com/Notable-Nomads/nn-backend-api/commit/b74c34a3950e67c63b580f5248228bbeb753c314))

### [0.0.6](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.1.0...v0.0.6) (2025-01-15)

### Features

- enhance email service and static asset handling ([30849a0](https://github.com/Notable-Nomads/nn-backend-api/commit/30849a0871ebca0b5e2aaf0e580dad2d193b3a17))

# [0.1.0](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.0.4...v0.1.0) (2025-01-11)

### Features

- **ci:** add GitHub Actions workflow for AWS deployment ([ab0ca97](https://github.com/Notable-Nomads/nn-backend-api/commit/ab0ca97dcf483d99696f6b1198e7cb2e4312a78d))
- **manifest:** configure capacity providers for production and staging environments ([3fcce87](https://github.com/Notable-Nomads/nn-backend-api/commit/3fcce8777eaa5a159e38e861c7a9a6b3eaa1c7a1))
- **manifest:** enhance resource configuration and auto-scaling for production and staging environments ([e71174d](https://github.com/Notable-Nomads/nn-backend-api/commit/e71174d207c1ccedeb90b544747a74e02b4f13c1))
- **manifest:** optimize cost management and load balancer settings for production and staging ([889559e](https://github.com/Notable-Nomads/nn-backend-api/commit/889559e8879affdfe3cf00254da764539f96dbd8))
- **release:** integrate semantic-release and update GitHub Actions workflow ([37e5818](https://github.com/Notable-Nomads/nn-backend-api/commit/37e58187bb5e72fa97dfa93ce846a1c36822a118))

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.0.5](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.0.4...v0.0.5) (2025-01-11)

### Features

- **manifest:** configure capacity providers for production and staging environments ([3fcce87](https://github.com/Notable-Nomads/nn-backend-api/commit/3fcce8777eaa5a159e38e861c7a9a6b3eaa1c7a1))
- **manifest:** enhance resource configuration and auto-scaling for production and staging environments ([e71174d](https://github.com/Notable-Nomads/nn-backend-api/commit/e71174d207c1ccedeb90b544747a74e02b4f13c1))
- **manifest:** optimize cost management and load balancer settings for production and staging ([889559e](https://github.com/Notable-Nomads/nn-backend-api/commit/889559e8879affdfe3cf00254da764539f96dbd8))

### [0.0.4](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.0.3...v0.0.4) (2025-01-10)

### Features

- **blog:** add new author to Medium profiles in BlogService ([ba55bf9](https://github.com/Notable-Nomads/nn-backend-api/commit/ba55bf9e468fc5ad47315b3b1dc5132f6e71debe))
- **email:** enhance admin email notifications with HTML and text formats ([2e311b6](https://github.com/Notable-Nomads/nn-backend-api/commit/2e311b6921ee15fba643b02e72e2f48c60e4b80c))
- **email:** enhance email service with user confirmation and admin notification ([c787194](https://github.com/Notable-Nomads/nn-backend-api/commit/c787194c282d88b034cc63bca66f9c0917d2ec86))
- **email:** refactor email service to utilize a centralized template helper ([61e5153](https://github.com/Notable-Nomads/nn-backend-api/commit/61e515313b3a1a560a3f39c5cd484980b1268cdd))

### [0.0.3](https://github.com/Notable-Nomads/nn-backend-api/compare/v0.0.2...v0.0.3) (2025-01-08)

### Features

- add blog module with XML parsing and Medium integration ([5644920](https://github.com/Notable-Nomads/nn-backend-api/commit/5644920a809da352c64a949726bd706d525b6ad2))

### 0.0.2 (2025-01-08)

### Features

- add AI chat module with WebSocket support and integrate Google Generative AI service ([b300b99](https://github.com/Notable-Nomads/nn-backend-api/commit/b300b99ea90c33bfb71e9418d17712b2f2de9bdb))
- add alias and hosted zone configuration for backend API in manifests ([416ae51](https://github.com/Notable-Nomads/nn-backend-api/commit/416ae51078b480a844880cb27b4c00e44db52661))
- add application controller and environment variables to backend-api manifest ([259957c](https://github.com/Notable-Nomads/nn-backend-api/commit/259957cb7aa4ab02cf5a8328654237d4b65f46b4))
- add AWS SDK for SES and update dependencies ([a8b6d34](https://github.com/Notable-Nomads/nn-backend-api/commit/a8b6d3463d6ff5d4f2058b8707be0a960de74812))
- add buildspec and manifest for nn-backend-api-main pipeline ([938744b](https://github.com/Notable-Nomads/nn-backend-api/commit/938744beed1d4a218cd5a1ce26d16ae9ccd920b0))
- add email module and AWS configuration ([f7f10cd](https://github.com/Notable-Nomads/nn-backend-api/commit/f7f10cdf412ce315a063978527a10028326ddc2b))
- add GEMINI_API_KEY to platform manifest for AI integration ([2a0ff58](https://github.com/Notable-Nomads/nn-backend-api/commit/2a0ff5805a39810a484cf793a3acd5ded1445bea))
- add health check module with axios and terminus dependencies ([38ec24a](https://github.com/Notable-Nomads/nn-backend-api/commit/38ec24a3768a7b7790d8989017a715ab74f26f2b))
- add HTML client for AI chat with WebSocket and SSE support ([84bf364](https://github.com/Notable-Nomads/nn-backend-api/commit/84bf364e2f6d33924c627f721570c7aed8569dfd))
- add initial Copilot workspace and service manifest for nn-backend-ms-service ([4101b6d](https://github.com/Notable-Nomads/nn-backend-api/commit/4101b6db4f6194d9cd6096e2ef4b9b0d85ce7fb5))
- add manifest and workspace configuration for backend-api service ([6ef00b9](https://github.com/Notable-Nomads/nn-backend-api/commit/6ef00b91aedf9f5203ee7b415305a8681b1ec87d))
- add manifest for nn-backend-ms-public service ([7d6ed5b](https://github.com/Notable-Nomads/nn-backend-api/commit/7d6ed5bc47a3f362d87c7e858df303dd92340408))
- add manifest for production environment ([159e5ca](https://github.com/Notable-Nomads/nn-backend-api/commit/159e5cae5bafb747be9e31ed2937f338de613e7f))
- add manifest for staging environment ([f925b38](https://github.com/Notable-Nomads/nn-backend-api/commit/f925b386b745e0c543646e2905ad6e5b892f360f))
- add production environment manifest for Copilot ([7d276b3](https://github.com/Notable-Nomads/nn-backend-api/commit/7d276b3ed780dc95defd5d8168ae47ed0f18058a))
- enhance environment configurations for production and staging ([f79cfca](https://github.com/Notable-Nomads/nn-backend-api/commit/f79cfca9f5a529fb5a1773c5753a00fc9dcec63c))
- enhance environment detection and API URL handling in AI chat client ([4796796](https://github.com/Notable-Nomads/nn-backend-api/commit/479679637da6637b497e25ea088e8fc388033be1))
- enhance manifest and main application configuration ([72504fe](https://github.com/Notable-Nomads/nn-backend-api/commit/72504fe8641c84838e45ac1a9c035b4ab6558aa4))
- implement dynamic CORS configuration for improved security ([a8a75b9](https://github.com/Notable-Nomads/nn-backend-api/commit/a8a75b9ac28fd56d892454ced47877f6ac3d1125))
- implement streaming response for AI chat with RxJS support ([85d9069](https://github.com/Notable-Nomads/nn-backend-api/commit/85d90695e67387f1efcd49f40546b2994b060f79))
- integrate Joi for environment validation and refactor configuration management ([e478851](https://github.com/Notable-Nomads/nn-backend-api/commit/e47885135e43bf82b366f7d24ca688d054be1f40))
- refactor CORS handling with dedicated CorsService for improved maintainability ([4649230](https://github.com/Notable-Nomads/nn-backend-api/commit/4649230118ccca0e59221cbf7331779451865b8f))
- remove alias and hosted zone configuration from backend API manifest ([881c669](https://github.com/Notable-Nomads/nn-backend-api/commit/881c6691ab38fabde62c5a9379206f8ffb43f77f))
- remove unused workspace configuration for application ([13920e5](https://github.com/Notable-Nomads/nn-backend-api/commit/13920e5ed8b46f92322d0dd9c4853da95bbd2b25))
- rename backend-api manifest to platform and add workspace configuration ([94617e8](https://github.com/Notable-Nomads/nn-backend-api/commit/94617e8b97791d07340d04e4a1a3b736a78904a5))
- update AI chat service and HTML for environment selection ([e849726](https://github.com/Notable-Nomads/nn-backend-api/commit/e849726ba286d852f3035ae127ccf23339921741))
- update AI chat service configuration and model integration ([f55f79a](https://github.com/Notable-Nomads/nn-backend-api/commit/f55f79a4aa0581615d51d1b822a34d4624d73989))
- update backend-api and production environment manifests with load balancer configuration ([edd9759](https://github.com/Notable-Nomads/nn-backend-api/commit/edd9759d3ad63bedffc3d684cd14d7152c03948e))
- update CORS configuration for production and platform manifests ([1a6eb33](https://github.com/Notable-Nomads/nn-backend-api/commit/1a6eb33f3028b0287b7b893a8d26bceeff9a3410))
- update CORS settings and optimize environment configurations ([3077b0b](https://github.com/Notable-Nomads/nn-backend-api/commit/3077b0b94ebcc3f11807c1c7c70a4c8ba263e3d1))
- update health check configuration and API prefix in backend-api manifest ([89d20b8](https://github.com/Notable-Nomads/nn-backend-api/commit/89d20b8af90140e791ddc5b9ac958a93453fda3f))
- update health check path to '/api/health' in backend-api manifest ([aed84c5](https://github.com/Notable-Nomads/nn-backend-api/commit/aed84c5878b72dbfd414658f7cf021fdc9be890e))
- update hosted zone configuration for backend API in manifest ([b1885ae](https://github.com/Notable-Nomads/nn-backend-api/commit/b1885ae062878d835bc95fc11a2c10e8ca57dc25))

### Bug Fixes

- update AI model in AiChatService to use 'gemini-1.5-flash-8b' for improved performance ([3fe4899](https://github.com/Notable-Nomads/nn-backend-api/commit/3fe48993298ca9ead3567c5c8a7fed900987177b))
- update ai-chat service to improve message handling and ensure compatibility with Google Generative AI ([2692e0f](https://github.com/Notable-Nomads/nn-backend-api/commit/2692e0f18c7552f9342c610b09fcb4d044208ea8))

### [0.0.5](https://github.com/MRdevX/nestifined-ms-framework/compare/v0.0.4...v0.0.5) (2024-10-30)

### Features

- add bade entity ([6ba321f](https://github.com/MRdevX/nestifined-ms-framework/commit/6ba321fee5a9a152e3d8ef2608927f4e612ce8ac))
- add rabbitmq support ([fc0df82](https://github.com/MRdevX/nestifined-ms-framework/commit/fc0df828ba026d13f42cae0d1e167c2c77421629))
- add search to books ([2db5231](https://github.com/MRdevX/nestifined-ms-framework/commit/2db5231618e56690b54302ab3e889f6757288c12))
- connect to database and add book entity and module ([cc582d2](https://github.com/MRdevX/nestifined-ms-framework/commit/cc582d2fbb4e114a5ee6428d4283bf6a4b7e232c))
- refine book entity ([eac0720](https://github.com/MRdevX/nestifined-ms-framework/commit/eac0720fa0f6996ef431d2710fa68533c8546bab))
- use uuid for book id ([fb07fc0](https://github.com/MRdevX/nestifined-ms-framework/commit/fb07fc09498d432b5d4c0a210c00c9550a731d24))

### Bug Fixes

- books table name ([3dd8b9d](https://github.com/MRdevX/nestifined-ms-framework/commit/3dd8b9de9696e3071528db41493d786e6c8dcdad))

### [0.0.4](https://github.com/MRdevX/nestifined-ms-framework/compare/v0.0.3...v0.0.4) (2024-10-29)

### [0.0.3](https://github.com/MRdevX/nestifined-ms-framework/compare/v0.0.2...v0.0.3) (2024-10-29)

### Features

- add Docker to the project ([63004b3](https://github.com/MRdevX/nestifined-ms-framework/commit/63004b3b55153b557171a312b227f358883b4aef))
- add env support for rabbitmq in s2s envs ([822aadf](https://github.com/MRdevX/nestifined-ms-framework/commit/822aadfd07c52c476a007c1ef12f4bdbd29342aa))
- add kubernetes deployment configurations ([d02be08](https://github.com/MRdevX/nestifined-ms-framework/commit/d02be08665eceb57c8b55d8d49d4526b308ed847))
- add namespaces for each k8s environent ([9b47dc2](https://github.com/MRdevX/nestifined-ms-framework/commit/9b47dc254898463b42faf1541302f424aa0ff79a))
- add secrets for each k8s env ([ef14fee](https://github.com/MRdevX/nestifined-ms-framework/commit/ef14fee5a48c3e109349f485cf0bd969872bb8fd))
- add typeorm and db config ([c6477f1](https://github.com/MRdevX/nestifined-ms-framework/commit/c6477f1f7b21e6a1501d98d8809be00936dbcae5))
- add typeorm and db config ([d9fa39d](https://github.com/MRdevX/nestifined-ms-framework/commit/d9fa39d716e7f1e763ff8a4d21665a6df626a21d))
- support different types of cors configuration ([c04a886](https://github.com/MRdevX/nestifined-ms-framework/commit/c04a886c9bbdb33311c7544e4cc3173f6f871c0b))
- upgrade eslint config to new format ([c42d297](https://github.com/MRdevX/nestifined-ms-framework/commit/c42d2972151a3c99f786bdff8732ff25be3d62ca))

### Bug Fixes

- joi import issue ([4917efb](https://github.com/MRdevX/nestifined-ms-framework/commit/4917efb5eaee95745c6c9c31a7fa702658521826))
- joi imports ([26cdd50](https://github.com/MRdevX/nestifined-ms-framework/commit/26cdd50dd16871cb550f6c88916662e38a75ac50))
- k8s kustomize config ([6b5de09](https://github.com/MRdevX/nestifined-ms-framework/commit/6b5de09dc003249141b935508b836d3883098f08))
- refine main file ([dcbf2c2](https://github.com/MRdevX/nestifined-ms-framework/commit/dcbf2c2b38161e7c07216de3f1667ad78bd404e3))
- remove husky deprecated command ([dcc29fc](https://github.com/MRdevX/nestifined-ms-framework/commit/dcc29fc3a890fb3e90714d175f83fcaf1e197b93))
- remove validations for now ([78c489e](https://github.com/MRdevX/nestifined-ms-framework/commit/78c489e214acce2ca6b144b1996d878d815c7dc7))
- yarn cache ([087928c](https://github.com/MRdevX/nestifined-ms-framework/commit/087928ce41728a122a72e07a1a5dc8e6490a81a2))

### 0.0.2 (2023-03-10)

### Features

- add config service ([9d23a6f](https://github.com/MRdevX/nestifined-ms-framework/commit/9d23a6fd3ced01fd50d934e53860e8104d16762e))

### Bug Fixes

- node env ([c57a356](https://github.com/MRdevX/nestifined-ms-framework/commit/c57a3563927c026738e5dd532232ae7aad5e73da))
