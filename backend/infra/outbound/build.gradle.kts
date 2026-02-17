dependencies {
    implementation(project(":domain"))
    implementation(project(":shared"))
    implementation("org.springframework.boot:spring-boot-starter-web")

    implementation("com.github.librepdf:openpdf:2.0.3")
    implementation("com.github.librepdf:openpdf-fonts-extra:2.0.3")
}
