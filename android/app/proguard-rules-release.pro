-include proguard-rules.pro

# Crashlytics
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception

# R8 missing classes - suppress warnings
-dontwarn com.facebook.memory.config.MemorySpikeConfig
-dontwarn kotlinx.parcelize.Parcelize
