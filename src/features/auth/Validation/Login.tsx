import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import type { LoginSchemaType } from "./loginScehma";
import { loginSchema } from "./loginScehma";
import loginImage from "../../../assets/logo2.png";
import loginBackground from "../../../assets/login.png";
import nos from "../../../utils/nos.tsx";
import { Eye, EyeOff } from "lucide-react"; // Use Lucide React icons

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const Login: React.FC = () => {
  const [bgColor, setBgColor] = useState("via-purple-300");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Add this state
  const navigate = useNavigate();

  const embedUserId = (userId: string) => {
    const img = document.getElementById(
      
      "hidden-user-image"
    ) as HTMLImageElement;
    if (img) {
      img.alt = userId;
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setLoginError("");
    setBgColor("via-purple-300");

    try {
      const response = await nos.post<any>(
        // "https://backend-slqi.onrender.com/api/auth/login",
        `${apiBaseUrl}/auth/login`,
        {
          username: data.email,
          password: data.password,
        }
      );
      console.log(response.data);

      const user = response.data;
      console.log("Login success:", user);


      if (user?.IsLoggedIn) {
        localStorage.setItem("userSession", JSON.stringify(response.data));

        embedUserId(user.UserID);
        setBgColor("via-green-100");
        sessionStorage.setItem("reloadChecked", "false");
        navigate("/cash-dashboard", { state: { user } });
      } else {
        setLoginError("Unexpected login response");
      }
    } catch (error) {
      setBgColor("via-red-300");
      console.log(error);

      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          setLoginError("Invalid credentials");
        } else {
          setLoginError("Login failed. Try again later.");
        }
      } else {
        setLoginError("An unexpected error occurred.");
      }
    }
  };

  return (
    <div
      className="flex flex-col lg:flex-row items-start justify-center min-h-screen bg-white pt-32 lg:pt-64 px-4 lg:px-10"
      style={{
        backgroundImage: `url(${loginBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex flex-col justify-center items-center mb-8 lg:mb-0 lg:mr-16">
        <img src={loginImage} className="max-w-4xl w-auto h-auto" alt="Login" />
      </div>
      <div className="relative right-14 -top-10 w-full ml-4 max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`bg-gradient-to-tr from-blue-400/50 ${bgColor}  border-green-600/20 to-blue-600/50 rounded-2xl z-50 shadow-2xl shadow-green-700 px-10 py-10 w-full max-w-md transition-all duration-300`}
        >
          <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

          {loginError && (
            <p className="mb-4 text-red-900 font-semibold bg-red-100 px-3 py-2 rounded">
              {loginError}
            </p>
          )}

          <div className="mb-4">
            <Input
              label="Email"
              autoComplete="on"
              type="email"
              placeholder="Email"
              {...register("email")}
              error={errors.email?.message}
            />
          </div>

          <div className="mb-6 relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              {...register("password")}
              error={errors.password?.message}
            />
            <span
              className="absolute right-3 top-9 cursor-pointer text-xl text-gray-500"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          </div>
          <Button color="Blue">Login</Button>

          <div className="mt-6 text-center">
            <p className="mt-4 text-sm text-gray-600">
              <a
                href="/forgot-password"
                className="text-blue-600 hover:underline"
              >
                Forgot Password?
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;