import { Query } from 'mongoose';

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  // Search bets
  search(searchableFields: string[]) {
    const search = this?.query?.search as string;
    if (search) {
      const searchRegex = {
        $or: searchableFields.map((field) => ({
          [field]: { $regex: search, $options: 'i' },
        })),
      };
      this.modelQuery = this.modelQuery.find(searchRegex);
    }
    return this;
  }
  

  // Filter bets
  filter() {
    const queryObj = { ...this.query };
    const excludeFields = ['search', 'sort', 'limit', 'page', 'fields'];
  
    excludeFields.forEach((field) => delete queryObj[field]);
  
    // Build a filter object dynamically
    const filterConditions: Record<string, unknown> = {};
  
    for (const key in queryObj) {
      if (queryObj[key]) {
        filterConditions[key] = queryObj[key];
      }
    }
  
    this.modelQuery = this.modelQuery.find(filterConditions);
    return this;
  }
  

  // Sort bets specific fields and order
  sort() {
    const sortBy = (this?.query?.sortBy as string) || 'createdAt';
    const sortOrder = (this?.query?.sortOrder as string) === 'asc' ? '' : '-';
    const sort = `${sortOrder}${sortBy}`;

    this.modelQuery = this.modelQuery.sort(sort);
    return this;
  }

  // Paginate
  paginate() {
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  // Field search
  fields() {
    const fields =
      (this?.query?.fields as string)?.split(',').join(' ') || '-__v';
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }
}

export default QueryBuilder;