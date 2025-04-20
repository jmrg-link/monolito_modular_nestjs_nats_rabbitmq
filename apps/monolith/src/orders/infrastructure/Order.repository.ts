import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Order } from "../domain/Order.entity";
import { OrderDocument } from "./Order.schema";
import {
  PaginatedResult,
  PaginationOptions,
} from "@libs/common/src/interfaces/pagination.interface";

@Injectable()
export class OrderRepository {
  constructor(
    @InjectModel(OrderDocument.name)
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  async save(order: Order): Promise<OrderDocument> {
    const created = new this.orderModel({
      userId: order.userId,
      total: order.total,
      products: [],
      status: "pending",
    });
    return created.save();
  }

  async findById(id: string): Promise<OrderDocument | null> {
    return this.orderModel.findById(id).exec();
  }

  async findAll(): Promise<OrderDocument[]> {
    return this.orderModel.find().exec();
  }

  async findWithPagination(
    options: PaginationOptions,
  ): Promise<PaginatedResult<OrderDocument>> {
    const { page = 1, limit = 10, sortBy, sortDirection = "desc" } = options;
    const skip = (page - 1) * limit;

    const query = this.orderModel.find();
    if (sortBy) {
      const sortOptions: Record<string, "asc" | "desc"> = {};
      sortOptions[sortBy] = sortDirection;
      query.sort(sortOptions);
    }

    const [items, totalItems] = await Promise.all([
      query.skip(skip).limit(limit).exec(),
      this.orderModel.countDocuments().exec(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      meta: {
        totalItems,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findByUserId(userId: string): Promise<OrderDocument[]> {
    return this.orderModel.find({ userId }).exec();
  }

  async update(
    id: string,
    update: Partial<{
      userId: string;
      total: number;
      products: string[];
      status: string;
      paidAt: Date;
    }>,
  ): Promise<OrderDocument | null> {
    return this.orderModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  async delete(id: string): Promise<OrderDocument | null> {
    return this.orderModel.findByIdAndDelete(id).exec();
  }
}
