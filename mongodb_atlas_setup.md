# MongoDB Atlas Setup Instructions

To connect your Replit application to MongoDB Atlas, you need to configure your MongoDB Atlas cluster to allow connections from Replit. Here are the steps to do that:

## Allow Access from Anywhere (Development Only)

For development purposes, you can allow connections from any IP address:

1. Log in to your MongoDB Atlas account
2. Go to your cluster "Cluster0"
3. Click on "Network Access" in the left menu
4. Click "Add IP Address"
5. Click "Allow Access from Anywhere" (sets 0.0.0.0/0)
6. Click "Confirm"

**Important**: This is not recommended for production use, only for development and testing.

## For Production

For a more secure setup in production:

1. Determine the IP addresses of your application servers
2. Add only those specific IP addresses to the whitelist

## Database Configuration 

Your application is set up with these configurations:

- Connection string in the `.env` file
- Fallback to in-memory MongoDB when Atlas connection fails
- Optimized connection parameters for stability

## Next Steps

Once you've updated your MongoDB Atlas network access settings:

1. Restart your Replit application
2. The application should now connect to your MongoDB Atlas database
3. It will create the necessary collections and indexes automatically

If you continue to have connection issues, check that your username and password are correct in the connection string.