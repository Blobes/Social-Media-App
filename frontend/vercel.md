{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://funstakes.onrender.com/:path*"
    },
    {
      "source": "/login",
      "destination": "https://my-auth-app.vercel.app"
    },
    {
      "source": "/signup",
      "destination": "https://my-auth-app.vercel.app"
    }
  ]
}
