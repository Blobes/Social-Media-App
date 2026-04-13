self.__BUILD_MANIFEST = {
  "__rewrites": {
    "afterFiles": [
      {
        "source": "/login"
      },
      {
        "source": "/signup"
      },
      {
        "source": "/gist/:path*"
      },
      {
        "source": "/stake/:path*"
      }
    ],
    "beforeFiles": [
      {
        "source": "/_next/static/auth/_next/static/:path*"
      },
      {
        "source": "/_next/static/post/_next/static/:path*"
      },
      {
        "source": "/api/:path*"
      }
    ],
    "fallback": []
  },
  "sortedPages": [
    "/_app",
    "/_error"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()