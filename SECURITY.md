**Secrets & Key Rotation**

- **If a key was exposed:** Revoke it immediately at the provider dashboard (OpenAI, Stripe). Then create a new key.
- **Where to store keys:** Add runtime secrets to your Railway project variables (Project → Service → Variables). Do NOT commit `.env`.
- **Local development:** Keep a local `.env` (ignored by git). Use `dotenv` or your shell to load values.
- **Updating Railway variables (manual):**
  1. Open your Railway project.

 2. Go to the service, open **Variables**, add or update `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, etc.
 3. Redeploy the service or push an empty commit to trigger a rebuild.

- **Optional purge from git history:** Use `git-filter-repo` or BFG to purge secrets from history. This rewrites history and requires collaborators to re-clone.

**Quick rotation checklist**

1. Revoke exposed keys in provider consoles.
2. Create new keys.
3. Update Railway variables with new keys.
4. Confirm app logs show the new variables are used and the app starts successfully.
5. If desired, purge secrets from git history (coordinate with collaborators).
