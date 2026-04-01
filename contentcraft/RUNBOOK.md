# ContentCraft Runbook

## Start

### Terminal 1
```bash
brew services start redis
cd /Users/umairali/Documents/Programs/contentcraft
npm run dev
```

### Terminal 2
```bash
cd /Users/umairali/Documents/Programs/contentcraft
npm run worker
```

### Open the app
`http://localhost:3000`

### Login
```text
Email: admin@contentcraft.app
Password: Admin1234!
```

## Stop

### Stop app and worker
- In the terminal running `npm run dev`, press `Ctrl + C`
- In the terminal running `npm run worker`, press `Ctrl + C`

### Stop Redis too
```bash
brew services stop redis
```

## Restart

### Terminal 1
```bash
brew services start redis
cd /Users/umairali/Documents/Programs/contentcraft
npm run dev
```

### Terminal 2
```bash
cd /Users/umairali/Documents/Programs/contentcraft
npm run worker
```

## Useful Checks

```bash
brew services list
git -C /Users/umairali/Documents/Programs status
```

## If Something Fails

- If you see a Redis connection error, run:
```bash
brew services start redis
```

- If GitHub is not updated, run:
```bash
cd /Users/umairali/Documents/Programs
git push origin main
```

- If the app looks stuck, stop both terminals with `Ctrl + C` and restart them.
