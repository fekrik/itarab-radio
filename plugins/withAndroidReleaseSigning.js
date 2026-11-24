const { withAppBuildGradle } = require('expo/config-plugins');

const GROOVY_SIGNING_BLOCK = `
if (System.getenv("ANDROID_KEYSTORE_PATH")) {
    android {
        signingConfigs {
            release {
                storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD") ?: System.getenv("ANDROID_KEYSTORE_PASSWORD")
            }
        }
        buildTypes {
            release {
                signingConfig signingConfigs.release
            }
        }
    }
}
`;

const KOTLIN_SIGNING_BLOCK = `
if (!System.getenv("ANDROID_KEYSTORE_PATH").isNullOrEmpty()) {
    android {
        val releaseSigning = signingConfigs.maybeCreate("release")
        releaseSigning.storeFile = file(System.getenv("ANDROID_KEYSTORE_PATH"))
        releaseSigning.storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
        releaseSigning.keyAlias = System.getenv("ANDROID_KEY_ALIAS")
        releaseSigning.keyPassword = System.getenv("ANDROID_KEY_PASSWORD") ?: System.getenv("ANDROID_KEYSTORE_PASSWORD")
        buildTypes.getByName("release") {
            signingConfig = releaseSigning
        }
    }
}
`;

/**
 * Configures Android release signing from CI/local environment variables when
 * ANDROID_KEYSTORE_PATH is provided, falling back to debug signing otherwise.
 */
module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.contents.includes('ANDROID_KEYSTORE_PATH')) {
      return modConfig;
    }

    const block =
      modConfig.modResults.language === 'kt' ? KOTLIN_SIGNING_BLOCK : GROOVY_SIGNING_BLOCK;

    modConfig.modResults.contents = `${modConfig.modResults.contents.trimEnd()}\n${block}`;
    return modConfig;
  });
};
