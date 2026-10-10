plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val garcilogaUrl = providers.gradleProperty("garcilogaUrl")
    .orElse("https://codezero-nine.vercel.app")
    .get()
require(garcilogaUrl.startsWith("https://")) {
    "garcilogaUrl debe usar HTTPS"
}
require(garcilogaUrl.removePrefix("https://").substringBefore('/').isNotBlank()) {
    "garcilogaUrl requiere un nombre de host"
}

android {
    namespace = "com.garciloga.android"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.garciloga.android"
        minSdk = 26
        targetSdk = 35
        versionCode = 2
        versionName = "1.0.1"
        buildConfigField("String", "APP_URL", "\"$garcilogaUrl\"")
        resourceConfigurations += listOf("es", "en", "fr", "pt")
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    buildTypes {
        getByName("debug") {
            isDebuggable = true
            isMinifyEnabled = false
        }
        getByName("release") {
            isDebuggable = false
            isMinifyEnabled = false
            // No se incluyen llaves de firma; firmar únicamente desde tu equipo.
        }
    }
}

// Deliberadamente sin Firebase, tokens de Supabase ni SDK de Stripe en el APK.
// La plataforma publicada aplica sesiones, planes, permisos, progreso y pagos.
