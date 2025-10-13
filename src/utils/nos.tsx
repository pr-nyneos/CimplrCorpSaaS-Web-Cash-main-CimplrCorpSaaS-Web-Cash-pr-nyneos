// src/utils/Nos.ts
import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

class Nos {
  private axiosInstance: AxiosInstance;
  private jwtToken: string | null;

  constructor() {
    this.axiosInstance = axios.create();
    this.jwtToken = null;
  }

  /**
   * Excavates userId from a hidden DOM element.
   * This keeps userId in sync across the app without localStorage/prop drilling.
   */
  private excavateUserId(): string | null {
    const img = document.getElementById(
      "hidden-user-image"
    ) as HTMLImageElement;
    return img?.alt || "1";
  }

  /**
   * Set JWT token after login.
   * This will be attached to all requests automatically.
   */
  public setJwtToken(token: string) {
    this.jwtToken = token;
  }

  /**
   * Generic request wrapper.
   * Injects userId + JWT, and verifies response.
   */
  private async request<T>(
    method: "get" | "post" | "put" | "delete",
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    const user_id = this.excavateUserId();
    if (!user_id) {
      throw new Error(
        "UserId not found in DOM — did you embed it after login?"
      );
    }

    const isGet = method === "get";
    let requestData = data;

    // 🟢 If FormData, append user_id directly
    if (!isGet && data instanceof FormData) {
      requestData = data;
      requestData.append("user_id", user_id);
    } else if (!isGet) {
      requestData = { ...data, user_id };
    }

    const finalConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        ...(config?.headers || {}),
        ...(this.jwtToken ? { Authorization: `Bearer ${this.jwtToken}` } : {}),
      },
    };

    const response = await this.axiosInstance.request<T>({
      method,
      url,
      data: isGet ? undefined : requestData,
      params: isGet ? data : undefined,
      ...finalConfig,
    });

    return response;
  }

  // Public helpers
  public get<T>(url: string, params?: any, config?: AxiosRequestConfig) {
    return this.request<T>("get", url, params, config);
  }

  public post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.request<T>("post", url, data, config);
  }

  public put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.request<T>("put", url, data, config);
  }

  public delete<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.request<T>("delete", url, data, config);
  }
}

// Export singleton instance
const nos = new Nos();
export default nos;
