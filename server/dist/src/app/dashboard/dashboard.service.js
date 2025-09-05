"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const dashboard_repository_1 = require("./dashboard.repository");
class DashboardService {
    static async getSummary() {
        const [totalAktif, totalJeda, totalJamHariIni, payrollBulanBerjalan] = await Promise.all([
            dashboard_repository_1.DashboardRepository.countAktif(),
            dashboard_repository_1.DashboardRepository.countJeda(),
            dashboard_repository_1.DashboardRepository.sumTotalJamHariIni(),
            dashboard_repository_1.DashboardRepository.sumPayrollBulanBerjalan(),
        ]);
        return { totalAktif, totalJeda, totalJamHariIni, payrollBulanBerjalan };
    }
}
exports.DashboardService = DashboardService;
exports.default = DashboardService;
