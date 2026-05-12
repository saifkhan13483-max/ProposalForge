# How to Push This Project to GitHub (Local Setup)

A complete step-by-step guide to push this project from your local machine to GitHub.

---

## Prerequisites

- [Git](https://git-scm.com/downloads) installed on your computer
- A [GitHub](https://github.com) account

---

## Step 1: Download the Project Files

1. Open your project editor
2. Click the three-dot menu **(...)** in the top-right corner of the file tree
3. Select **Download as zip**
4. Extract the downloaded `.zip` file to a folder on your computer (e.g., `proposal-forge`)

---

## Step 2: Install Git (if not already installed)

**Windows:**
- Download from [https://git-scm.com/download/win](https://git-scm.com/download/win) and run the installer

**Mac:**
- Open Terminal and run:
  ```bash
  xcode-select --install
  ```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update && sudo apt install git
```

Verify installation:
```bash
git --version
```

---

## Step 3: Configure Git (First-Time Setup)

Open your terminal / command prompt and run:

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

Replace with the name and email linked to your GitHub account.

---

## Step 4: Create a New Repository on GitHub

1. Go to [https://github.com/new](https://github.com/new)
2. Fill in:
   - **Repository name** — e.g., `proposal-forge`
   - **Description** — optional
   - **Visibility** — Public or Private
3. **Do NOT** check "Add a README file" or any other initialisation options
4. Click **Create repository**
5. Copy the repository URL shown — it looks like:
   ```
   https://github.com/your-username/proposal-forge.git
   ```

---

## Step 5: Initialise Git in Your Project Folder

Open a terminal and navigate to your extracted project folder:

```bash
cd path/to/proposal-forge
```

Then initialise git:

```bash
git init
```

---

## Step 6: Add a .gitignore (Recommended)

Make sure the `node_modules` folder is not pushed. Check if a `.gitignore` file exists:

```bash
cat .gitignore
```

If it doesn't exist, create one:

```bash
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo "dist/" >> .gitignore
```

---

## Step 7: Stage All Files

Add all project files to git:

```bash
git add .
```

---

## Step 8: Create the First Commit

```bash
git commit -m "Initial commit"
```

---

## Step 9: Connect to Your GitHub Repository

Link your local project to the GitHub repository you created:

```bash
git remote add origin https://github.com/your-username/proposal-forge.git
```

Replace the URL with the one you copied in Step 4.

---

## Step 10: Push to GitHub

```bash
git branch -M main
git push -u origin main
```

You will be prompted to log in to GitHub. Use your GitHub username and a **Personal Access Token** (not your password).

---

## How to Create a Personal Access Token (PAT)

GitHub no longer accepts passwords for git push. You need a token:

1. Go to [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Give it a name (e.g., `push-token`)
4. Set expiration as needed
5. Under **Scopes**, check **repo**
6. Click **Generate token**
7. Copy the token — **you will only see it once**
8. Use it as your password when prompted during `git push`

---

## Step 11: Verify on GitHub

1. Go to `https://github.com/your-username/proposal-forge`
2. You should see all your project files uploaded

---

## Pushing Future Changes

Whenever you make changes and want to update GitHub:

```bash
git add .
git commit -m "Describe your changes here"
git push
```

---

## Common Errors & Fixes

| Error | Fix |
|---|---|
| `remote origin already exists` | Run `git remote set-url origin <your-url>` |
| `failed to push — updates were rejected` | Run `git pull origin main --rebase` then push again |
| `Authentication failed` | Use a Personal Access Token instead of your password |
| `src refspec main does not match any` | Make sure you have at least one commit: `git commit -m "init"` |

---

That's it! Your project is now on GitHub.
