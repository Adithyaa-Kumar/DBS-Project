# ⚡ Quick Start Guide

## Installation

### Windows
```bash
# Run the setup script
setup.bat
```

### Mac/Linux
```bash
# Make script executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

### Manual Installation
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Running the Application

### Terminal 1: Start Backend
```bash
cd backend
npm start
```
Backend will run at `http://localhost:5000`

### Terminal 2: Start Frontend
```bash
cd frontend
npm run dev
```
Frontend will run at `http://localhost:3000`

## First Time Usage

1. **Create a Table**
   - Go to "Table Builder" tab
   - Name: `users`
   - Add column: `user_id` (integer, Primary Key)
   - Add column: `name` (text)
   - Click "Create Table"

2. **Insert Data**
   - Go to "Data Entry" tab
   - Select `users` table
   - Enter: user_id = 1, name = "John"
   - Click "Insert Row"

3. **Create Related Table**
   - Create table `posts`
   - Column: `post_id` (integer, Primary Key)
   - Column: `user_id` (integer, Foreign Key → users.user_id)
   - Column: `title` (text)

4. **Insert Related Data**
   - Insert into posts: post_id = 101, user_id = 1, title = "Hello"

5. **Simulate Deletion**
   - Go to "Simulator" tab
   - Select table: `users`
   - Select row: 1
   - Click "Simulate Delete"
   - View the graph showing impact

## Key Features

- ✅ No SQL required
- ✅ Create tables through UI
- ✅ Insert data with FK validation
- ✅ View relationships
- ✅ Simulate deletion impact
- ✅ Interactive graph visualization
- ✅ Cascade deletion analysis

## Troubleshooting

**Backend won't start?**
- Ensure port 5000 is available
- Check Node.js is installed: `node --version`

**Frontend won't load?**
- Ensure backend is running first
- Check port 3000 is available
- Clear browser cache

**Can't insert data?**
- Verify foreign key value exists in referenced table
- Check the data type matches

## Full Documentation

See `README.md` for complete documentation.
