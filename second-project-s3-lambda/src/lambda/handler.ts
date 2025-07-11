export const lambdaExample1 = async (e: any) => {
  console.log("Hi from function lambda");
  return {
    status: 200,
    message: "Hello from function lambda",
  };
};
