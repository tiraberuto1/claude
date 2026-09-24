pluginManagement {
    repositories {
        mavenCentral()
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositories {
        mavenCentral()
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
    }
}

rootProject.name = "fukidashi-translator"
include(":core")

// Android SDK がない環境（CI の JVM テストなど）では :app を外して :core だけビルドできるようにする
val localSdk = file("local.properties").takeIf { it.exists() }?.readLines()
    ?.firstOrNull { it.startsWith("sdk.dir=") }?.substringAfter("=")
val sdkDir = localSdk ?: System.getenv("ANDROID_HOME") ?: System.getenv("ANDROID_SDK_ROOT")
if (sdkDir != null && file(sdkDir).exists()) {
    include(":app")
    gradle.extra["withAndroidApp"] = true
} else {
    println("Android SDK が見つからないため :app を除外します（:core のみ）")
}
