import { HydratedDocument, Model, QueryFilter, UpdateQuery } from 'mongoose'
class BaseRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}

  async create(data: Partial<TDocument>): Promise<HydratedDocument<TDocument>> {
    return this.model.create(data)
  }

   async findOneAndUpdate({ filter, update, options }:
     { filter: QueryFilter<TDocument>, update: UpdateQuery<TDocument>, options?: any }): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOneAndUpdate(filter, update, options).exec() as unknown as Promise<HydratedDocument<TDocument> | null>
  }

  async findById(id: string): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findById(id).exec()
  }

  async findOne({ filter, projection, options }:
     { filter: QueryFilter<TDocument>, projection?: any ,options?: any }): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOne(filter, projection).sort(options).exec()
  }

  async find({ filter, projection, options }:
     { filter: QueryFilter<TDocument>, projection?: any ,options?: any }): Promise<HydratedDocument<TDocument>[]> {
    return this.model.find(filter, projection).sort(options).exec()
  }

  async update(id: string, data: Partial<TDocument>): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec()
  }

  async delete(id: string): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findByIdAndDelete(id).exec()
  }
}

export default BaseRepository
