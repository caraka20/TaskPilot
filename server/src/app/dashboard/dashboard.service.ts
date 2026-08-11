import { DashboardRepository } from "./dashboard.repository"
import { DashboardSummary } from "./dashboard.model"

export class DashboardService {
  static async getSummary(): Promise<DashboardSummary> {
    const [totalAktif, totalJeda, totalJamHariIni, payrollBulanBerjalan] = await Promise.all([
      DashboardRepository.countAktif(),
      DashboardRepository.countJeda(),
      DashboardRepository.sumTotalJamHariIni(),
      DashboardRepository.sumPayrollBulanBerjalan(),
    ])

    return { totalAktif, totalJeda, totalJamHariIni, payrollBulanBerjalan }
  }
}

export default DashboardService
