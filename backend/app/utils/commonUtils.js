module.exports = {
  paginationFn: async (res, model, filterQuery, perPage = 10, currentPage = 1, select = null, sort = { createdAt: -1 }) => {
    const totalCount = await model.countDocuments(filterQuery);
    const rows = await model.find(filterQuery)
      .select(select)
      .sort(sort)
      .skip((currentPage - 1) * perPage)
      .limit(Number(perPage));

    const pagination = {
      totalItems:  totalCount,   // alias for frontend
      totalCount,
      totalPages: Math.ceil(totalCount / perPage),
      currentPage: Number(currentPage),
      perPage: Number(perPage),
    };

    return { rows, pagination };
  },
};
