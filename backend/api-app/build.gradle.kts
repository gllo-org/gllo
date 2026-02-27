plugins {
    id("org.springframework.boot")
}

tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    archiveFileName.set("app.jar")
}

dependencies {
    implementation(project(":application"))
    implementation(project(":inbound:web"))
    implementation(project(":infra:jpa"))
    implementation(project(":infra:outbound"))
    implementation(project(":infra:security"))
    implementation(project(":shared"))
    implementation("org.springframework.boot:spring-boot-starter")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    developmentOnly("org.springframework.boot:spring-boot-devtools")
}
