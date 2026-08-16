import { Request, Response, NextFunction } from "express";

import { dashboardService } from "./dashboard.service";

export class DashboardController {
    async getDashboard(req:Request, res: Response, next: NextFunction): Promise<void>{
        try {
            const userId = req.user.id;

            const dashboard = await dashboardService.getDashboard(userId,req.query);

            res.status(200).json({
                success: true,
                data: dashboard
            });
        } catch (error) {
            next(error);
        }
    }
}

export const dashboardController = new DashboardController();