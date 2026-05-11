import admin from 'firebase-admin'

let initPromise: Promise<admin.app.App> | null = null

function getApp(): Promise<admin.app.App> {
  if (initPromise) return initPromise

  initPromise = new Promise((resolve, reject) => {
    try {
      if (admin.apps.length > 0) {
        resolve(admin.app())
        return
      }

      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      if (!serviceAccountJson) {
        reject(new Error(
          'FIREBASE_SERVICE_ACCOUNT_JSON is not set. ' +
          'Go to Firebase Console → Project Settings → Service Accounts → Generate new private key, ' +
          'then add the JSON as a single-line secret named FIREBASE_SERVICE_ACCOUNT_JSON.'
        ))
        return
      }

      let serviceAccount: admin.ServiceAccount
      try {
        serviceAccount = JSON.parse(serviceAccountJson)
      } catch {
        reject(new Error(
          'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. ' +
          'Make sure the value is a single line with no literal newlines. ' +
          'Re-download the service account key from Firebase Console and paste it as one line.'
        ))
        return
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })

      resolve(admin.app())
    } catch (err) {
      initPromise = null
      reject(err)
    }
  })

  return initPromise
}

export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const app = await getApp()
  return app.auth().verifyIdToken(idToken)
}

/**
 * Call during server startup to surface Firebase Admin config errors early
 * instead of silently failing on the first login attempt.
 */
export async function validateFirebaseAdmin(): Promise<void> {
  try {
    await getApp()
    console.log('Firebase Admin initialized successfully')
  } catch (err) {
    console.error('⚠️  Firebase Admin initialization FAILED:', (err as Error).message)
    console.error('   Auth endpoints will return 503 until this is fixed.')
  }
}
