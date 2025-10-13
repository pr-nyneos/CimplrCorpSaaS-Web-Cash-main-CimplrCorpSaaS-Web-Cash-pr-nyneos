import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { z } from "zod";
import loginImage from "../../../assets/logo2.png";
import { useNavigate } from "react-router-dom";
import loginBackground from '../../../assets/login.png';
// import useNavigate
// Zod schema for email validation
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const [bgColor, setBgColor] = useState("via-purple-300");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  const navigate = useNavigate();
  const onSubmit = (data: ForgotPasswordSchemaType) => {
    setMessage("");
    setError("");
    setBgColor("via-purple-300");

    // Simulate fake API call
    setTimeout(() => {
      if (data.email === "notfound@example.com") {
        setError("Email not found in our system.");
        setBgColor("via-red-300");
      } else {
        setMessage("Reset link has been sent to your email.");
        setBgColor("via-green-100");
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    }, 1000);
  };

  return (
    <div
      className="flex items-start justify-end min-h-screen bg-white pt-64 pr-10"
      style={{
        backgroundImage: `url(${loginBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative -left-24">
        <img src={loginImage} className="max-w-5xl" alt="Login" />
      </div>

      <div className="relative right-14 -top-10 w-full max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`bg-gradient-to-tr from-blue-400/50 ${bgColor} border-green-600/20 to-blue-600/50 rounded-2xl z-50 shadow-2xl shadow-green-700 px-10 py-10 w-full max-w-md transition-all duration-300`}
        >
          <h2 className="text-2xl font-bold text-center mb-6">
            Forgot Password
          </h2>

          {message && (
            <p className="mb-4 text-green-800 bg-green-100 text-sm font-semibold px-3 py-2 rounded">
              {message}
            </p>
          )}
          {error && (
            <p className="mb-4 text-red-800 bg-red-100 text-sm font-semibold px-3 py-2 rounded">
              {error}
            </p>
          )}

          <div className="mb-6">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your registered email"
              {...register("email")}
              error={errors.email?.message}
            />
          </div>

          <Button type="submit" color="Blue">
            Send Reset Link
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
