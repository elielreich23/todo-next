# Create Admin User on Railway

This guide shows you how to create a Django admin superuser account on Railway.

## Method 1: Using Railway CLI (Recommended)

### Step 1: Install Railway CLI

```bash
# Windows (PowerShell)
iwr https://railway.app/install.sh | iex

# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh
```

### Step 2: Login to Railway

```bash
railway login
```

### Step 3: Link to Your Project

```bash
railway link
```

Select your project and service when prompted.

### Step 4: Create Admin User

**Option A: Using the create_admin.py script**

```bash
cd backend
railway run python create_admin.py
```

**Option B: Using Django's createsuperuser command**

```bash
cd backend
railway run python manage.py createsuperuser
```

You'll be prompted to enter:
- Email: `admin@taskero.com` (or your preferred email)
- Username: `admin` (or your preferred username)
- Full Name: `Admin User` (or your preferred name)
- Password: Enter a secure password

### Step 5: Login to Admin Panel

1. Go to: `https://todo-next-production.up.railway.app/admin`
2. Enter the email and password you just created
3. You should now have access to the Django admin panel

---

## Method 2: Using Railway Dashboard Shell

### Step 1: Open Railway Shell

1. Go to [Railway Dashboard](https://railway.app)
2. Select your project
3. Click on your backend service
4. Go to the **Deployments** tab
5. Click on the latest deployment
6. Click **Shell** button (or use the terminal icon)

### Step 2: Navigate to Backend Directory

```bash
cd backend
```

### Step 3: Create Admin User

**Option A: Using the script (creates default admin)**

```bash
python create_admin.py
```

This will create:
- Email: `admin@taskero.com`
- Password: `admin123`
- Username: `admin`

**Option B: Using Django command (interactive)**

```bash
python manage.py createsuperuser
```

Follow the prompts to create your admin account.

---

## Method 3: Using Environment Variables

You can set environment variables in Railway to customize the admin account:

1. Go to Railway Dashboard → Your Service → **Variables** tab
2. Add these environment variables (optional):

```
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
ADMIN_FULL_NAME=Admin User
```

3. Then run the script:

```bash
railway run python backend/create_admin.py
```

The script will use the environment variables if set.

---

## Method 4: Quick Default Admin (Using Script)

The `create_admin.py` script creates a default admin account:

- **Email**: `admin@taskero.com`
- **Password**: `admin123`
- **Username**: `admin`
- **Full Name**: `Admin User`

**⚠️ Security Warning**: Change the default password immediately after first login!

### Run the Script

```bash
# Using Railway CLI
railway run python backend/create_admin.py

# Or in Railway Shell
cd backend
python create_admin.py
```

---

## Troubleshooting

### "Command not found: railway"

Install Railway CLI first (see Method 1, Step 1).

### "ModuleNotFoundError: No module named 'django'"

Make sure you're in the `backend` directory or using `railway run` from the project root.

### "Superuser already exists"

The admin account already exists. You can:
1. Use the existing credentials
2. Reset the password (see below)
3. Delete and recreate the user

### Reset Admin Password

If you forgot the password, you can reset it:

```bash
# In Railway shell
cd backend
python manage.py changepassword admin@taskero.com
```

Or use the script with a new password:

```bash
railway run python backend/create_admin.py admin@taskero.com newpassword123
```

### Change Default Admin Credentials

To use different credentials, run:

```bash
railway run python backend/create_admin.py your-email@example.com yourpassword123 yourusername "Your Full Name"
```

Or set environment variables in Railway and run the script.

---

## Security Best Practices

1. **Change Default Password**: If using the default `admin123`, change it immediately
2. **Use Strong Password**: Use a complex password with letters, numbers, and symbols
3. **Set Environment Variables**: For production, set `ADMIN_PASSWORD` as an environment variable
4. **Limit Admin Access**: Only create admin accounts for trusted users
5. **Regular Password Updates**: Change admin passwords periodically

---

## Verify Admin Account

After creating the admin account, verify it works:

1. Go to: `https://todo-next-production.up.railway.app/admin`
2. Login with your credentials
3. You should see the Django admin dashboard

---

## Quick Reference

```bash
# Create default admin
railway run python backend/create_admin.py

# Create custom admin (interactive)
railway run python backend/manage.py createsuperuser

# Create admin with specific credentials
railway run python backend/create_admin.py email@example.com password123 username "Full Name"

# Reset password
railway run python backend/manage.py changepassword email@example.com
```
