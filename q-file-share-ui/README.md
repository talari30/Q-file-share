# QFileShare UI

User-interface for secure file sharing application, developed using Post-Quantum Cryptography techniques.

## Getting Started with QFileShare UI with Next.js

### Install Dependencies

Run the following command to install all required dependencies:

```bash
npm install
```

### Configure Environment Variables

Create a `.env.local` file for local development or a `.env` file for production deployments. Add the following configuration:

```plaintext
NEXT_PUBLIC_API_BASE_URL=http://<IP>:<PORT>
```

Replace `<IP>` and `<PORT>` with the appropriate values for your setup.

### Run the Development Server

Start the development server using one of the following commands:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev]
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application in action.

## Project Structure

The project follows a modular structure for maintainability and scalability, as outlined below:

- **`app`**  
  Contains all pages organized by their respective routes, following Next.js conventions.

- **`assets`**  
  Includes all static files such as images and other media assets.

- **`constants`**  
  Stores all hardcoded strings and other constants used across the project. These can be imported as needed.

- **`context`**  
  Implements context providers to manage and share state across the application.

- **`elements`**  
  Contains basic atomic-level elements such as `Input`, `Button`, and `Text`. These are reusable components used throughout the application.

- **`modules`**  
  Consists of one or more elements combined to build functional components or sections of web pages.

- **`quantum-protocols`**  
  Contains the implementation of post-quantum cryptographic protocols, **DiLithium** and **Kyber**.

- **`utils`**  
  Contains helper and utility functions to support various functionalities.

## Commit Message Format

Commit messages need to follow [ESLint commit message format](https://eslint.org/docs/developer-guide/contributing/pull-requests#step-2-make-your-changes):

```
<Tag>: <Summary>
```

Use the following tags for commit messages:

- **Breaking** - For a backward-incompatible enhancement or feature.
- **Build** - Changes applied to the build process only.
- **Chore** - For refactoring, adding test cases, etc.
- **Docs** - Changes for documentation only.
- **Fix** - For a bug fix.
- **New** - For a new feature.
- **Update** - Either for backward compatibility or for a rule change that adds reported problems.
- **WIP** - For work that is still in progress but needs to be committed.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
