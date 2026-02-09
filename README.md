
# CelWrite - CELPIP Writing Exam Simulator

CelWrite is a professional-grade simulation tool for CELPIP Writing Test candidates. It provides a high-fidelity exam environment, realistic tasks, and instant, robust AI evaluation using the Gemini 3 Pro model.

## 🚀 Key Features

- **Realistic Exam UI**: Mirrors the actual CELPIP Writing test environment.
- **Side-by-Side View**: Keep the prompt visible while you type, even on mobile.
- **Live Word Count**: Real-time tracking with threshold alerts.
- **Dual Tasks**: Supports Task 1 (Email Writing) and Task 2 (Survey Response).
- **Custom Mode**: Create your own prompts for targeted practice.
- **AI Examiner**: Get honest band scores (1-12) and detailed feedback based on official rubrics.
- **Vocabulary Upgrade**: Direct suggestions to replace common words with high-level alternatives.

## 🌐 Deployment to Vercel (Recommended)

Vercel provides a seamless hosting experience with built-in support for environment variables.

1.  **Push your code to GitHub**.
2.  **Import the project into Vercel**.
3.  **Configure Environment Variables**:
    *   In the Vercel project dashboard, go to **Settings** > **Environment Variables**.
    *   Add a new variable:
        *   **Key**: `API_KEY`
        *   **Value**: Your Google AI Studio API Key.
4.  **Deploy**: Vercel will automatically detect the static configuration and the `vercel.json` file provided in the repository.

## 🌐 Deployment to GitHub Pages

To host CelWrite on GitHub Pages and use the Gemini API securely:

### 1. Configure GitHub Secrets
1.  Go to your repository on GitHub.
2.  Click **Settings** > **Secrets and variables** > **Actions**.
3.  Click **New repository secret**.
4.  Name: `GEMINI_API_KEY`
5.  Value: Your Google AI Studio API Key.

### 2. Set Up GitHub Actions Workflow
Create a file at `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Deploy
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: .
```

## 🛠️ Local Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/celwrite.git
    cd celwrite
    ```
2.  **Run a Static Server**:
    ```bash
    npx serve .
    ```

## 🔑 Obtaining an API Key

1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Create a new API Key.
3.  **Note**: If you are using the "Pay-as-you-go" plan (recommended for high-quality Gemini 3 Pro access), ensure you have billing set up in a GCP project and select it in the AI Studio key manager.

---
*Disclaimer: CelWrite is a practice tool and is not affiliated with Paragon Testing Enterprises or the official CELPIP exam.*
