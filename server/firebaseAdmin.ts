import admin from 'firebase-admin'

let initialized = false

function getApp(): admin.app.App {
  if (initialized) return admin.app()

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not set')
  }

  const serviceAccount = JSON.parse(serviceAccountJson)

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })

  initialized = true
  return admin.app()
}

export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const app = getApp()
  return app.auth().verifyIdToken(idToken)
}
