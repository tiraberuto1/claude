// AGP は Google Maven からしか取れないため、:app を含むときだけ読み込む
buildscript {
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
    if (gradle.extra.has("withAndroidApp")) {
        dependencies { classpath("com.android.tools.build:gradle:8.7.3") }
    }
}

plugins {
    kotlin("jvm") version "2.0.21" apply false
    kotlin("android") version "2.0.21" apply false
}
