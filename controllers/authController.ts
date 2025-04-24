// Example user creation
const user = await prisma.user.create({
  data: {
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: hashedPassword,
    role: 1, // This references the USER role we created in the seed
  }
}); 