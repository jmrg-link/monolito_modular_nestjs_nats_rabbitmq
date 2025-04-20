import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Product } from "../domain/Product.entity";
import { ProductDocument } from "./Product.schema";
import {
  PaginatedResult,
  PaginationOptions,
} from "@libs/common/src/interfaces/pagination.interface";

@Injectable()
export class ProductRepository {
  constructor(
    @InjectModel(ProductDocument.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async save(product: Product): Promise<ProductDocument> {
    const created = new this.productModel({
      name: product.name,
      price: product.price,
      isActive: true,
    });
    return created.save();
  }

  async findById(id: string): Promise<ProductDocument | null> {
    return this.productModel.findById(id).exec();
  }

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel.find().exec();
  }

  async findWithPagination(
    options: PaginationOptions,
  ): Promise<PaginatedResult<ProductDocument>> {
    const { page = 1, limit = 10, sortBy, sortDirection = "desc" } = options;
    const skip = (page - 1) * limit;

    const query = this.productModel.find();
    if (sortBy) {
      const sortOptions: Record<string, "asc" | "desc"> = {};
      sortOptions[sortBy] = sortDirection;
      query.sort(sortOptions);
    }

    const [items, totalItems] = await Promise.all([
      query.skip(skip).limit(limit).exec(),
      this.productModel.countDocuments().exec(),
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

  async searchByName(term: string): Promise<ProductDocument[]> {
    const regex = new RegExp(term, "i");
    return this.productModel.find({ name: { $regex: regex } }).exec();
  }

  async findByPriceRange(min: number, max: number): Promise<ProductDocument[]> {
    return this.productModel.find({ price: { $gte: min, $lte: max } }).exec();
  }

  async update(
    id: string,
    update: Partial<{
      name: string;
      price: number;
      isActive: boolean;
      description: string;
    }>,
  ): Promise<ProductDocument | null> {
    return this.productModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }

  async delete(id: string): Promise<ProductDocument | null> {
    return this.productModel.findByIdAndDelete(id).exec();
  }
}
