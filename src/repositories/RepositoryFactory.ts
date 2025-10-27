/**
 * Repository Factory
 * Central place to get repository instances
 * Makes it easy to switch between JSON, PostgreSQL, MongoDB, etc.
 */

import { IEnterpriseRepository } from "./IEnterpriseRepository";
import { IUserRepository } from "./IUserRepository";
import { IEnterpriseTokenRepository } from "./IEnterpriseTokenRepository";
import { IDltOperationRepository } from "./IDltOperationRepository";
import { IWageAdvanceRepository } from "./IWageAdvanceRepository";

import { enterpriseRepository as jsonEnterpriseRepo } from "./implementations/JsonEnterpriseRepository";
import { userRepository as jsonUserRepo } from "./implementations/JsonUserRepository";
import { enterpriseTokenRepository as jsonTokenRepo } from "./implementations/JsonEnterpriseTokenRepository";
import { dltOperationRepository as jsonDltOpRepo } from "./implementations/JsonDltOperationRepository";
import { wageAdvanceRepository as jsonWageAdvanceRepo } from "./implementations/JsonWageAdvanceRepository";

/**
 * Repository type - can be extended to support other storage backends
 */
type RepositoryType = "json" | "postgres" | "mongodb";

/**
 * Repository Factory Class
 */
class RepositoryFactory {
  private repositoryType: RepositoryType;

  constructor(type: RepositoryType = "json") {
    this.repositoryType = type;
  }

  /**
   * Set the repository type (json, postgres, mongodb, etc.)
   */
  setRepositoryType(type: RepositoryType): void {
    this.repositoryType = type;
  }

  /**
   * Get Enterprise Repository
   */
  getEnterpriseRepository(): IEnterpriseRepository {
    switch (this.repositoryType) {
      case "json":
        return jsonEnterpriseRepo;
      case "postgres":
        // TODO: Implement PostgreSQL repository
        throw new Error("PostgreSQL repository not implemented yet");
      case "mongodb":
        // TODO: Implement MongoDB repository
        throw new Error("MongoDB repository not implemented yet");
      default:
        return jsonEnterpriseRepo;
    }
  }

  /**
   * Get User Repository
   */
  getUserRepository(): IUserRepository {
    switch (this.repositoryType) {
      case "json":
        return jsonUserRepo;
      case "postgres":
        throw new Error("PostgreSQL repository not implemented yet");
      case "mongodb":
        throw new Error("MongoDB repository not implemented yet");
      default:
        return jsonUserRepo;
    }
  }

  /**
   * Get Enterprise Token Repository
   */
  getEnterpriseTokenRepository(): IEnterpriseTokenRepository {
    switch (this.repositoryType) {
      case "json":
        return jsonTokenRepo;
      case "postgres":
        throw new Error("PostgreSQL repository not implemented yet");
      case "mongodb":
        throw new Error("MongoDB repository not implemented yet");
      default:
        return jsonTokenRepo;
    }
  }

  /**
   * Get DLT Operation Repository
   */
  getDltOperationRepository(): IDltOperationRepository {
    switch (this.repositoryType) {
      case "json":
        return jsonDltOpRepo;
      case "postgres":
        throw new Error("PostgreSQL repository not implemented yet");
      case "mongodb":
        throw new Error("MongoDB repository not implemented yet");
      default:
        return jsonDltOpRepo;
    }
  }

  /**
   * Get Wage Advance Repository
   */
  getWageAdvanceRepository(): IWageAdvanceRepository {
    switch (this.repositoryType) {
      case "json":
        return jsonWageAdvanceRepo;
      case "postgres":
        throw new Error("PostgreSQL repository not implemented yet");
      case "mongodb":
        throw new Error("MongoDB repository not implemented yet");
      default:
        return jsonWageAdvanceRepo;
    }
  }
}

// Singleton instance
// Can be configured via environment variable
const repositoryType = (process.env.REPOSITORY_TYPE as RepositoryType) || "json";
export const repositoryFactory = new RepositoryFactory(repositoryType);

// Convenience exports
export const getEnterpriseRepository = () =>
  repositoryFactory.getEnterpriseRepository();
export const getUserRepository = () => repositoryFactory.getUserRepository();
export const getEnterpriseTokenRepository = () =>
  repositoryFactory.getEnterpriseTokenRepository();
export const getDltOperationRepository = () =>
  repositoryFactory.getDltOperationRepository();
export const getWageAdvanceRepository = () =>
  repositoryFactory.getWageAdvanceRepository();
