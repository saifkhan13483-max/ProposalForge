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
        reject(new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not set'))
        return
      }

      const serviceAccount = JSON.parse(serviceAccountJson)

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
