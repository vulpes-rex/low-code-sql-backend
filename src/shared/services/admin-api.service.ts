import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

@Injectable()
export class AdminApiService {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('ADMIN_API_URL');
  }

  async getUserById(userId: string): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.get<ApiResponse<any>>(`${this.baseUrl}/users/${userId}`),
    );
    return response.data.data;
  }

  async getUserByEmail(email: string): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.get<ApiResponse<any>>(`${this.baseUrl}/users/email/${email}`),
    );
    return response.data.data;
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const response = await firstValueFrom(
      this.httpService.get<ApiResponse<string[]>>(`${this.baseUrl}/users/${userId}/roles`),
    );
    return response.data.data;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const response = await firstValueFrom(
      this.httpService.get<ApiResponse<string[]>>(`${this.baseUrl}/users/${userId}/permissions`),
    );
    return response.data.data;
  }

  async getRoleById(roleId: string): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.get<ApiResponse<any>>(`${this.baseUrl}/roles/${roleId}`),
    );
    return response.data.data;
  }

  async getRolePermissions(roleId: string): Promise<string[]> {
    const response = await firstValueFrom(
      this.httpService.get<ApiResponse<string[]>>(`${this.baseUrl}/roles/${roleId}/permissions`),
    );
    return response.data.data;
  }

  async checkUserPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<ApiResponse<{ hasPermission: boolean }>>(
          `${this.baseUrl}/users/${userId}/permissions/check/${permission}`,
        ),
      );
      return response.data.data.hasPermission;
    } catch (error) {
      return false;
    }
  }
} 