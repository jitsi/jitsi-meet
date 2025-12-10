-include proguard-rules.pro

# Crashlytics
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception

# Giphy SDK using Kotlin Parcelize
-dontwarn kotlinx.parcelize.Parcelize
