// src/modules/shopping-list/shoppingListAdapter.ts

export interface ShoppingListDto {
    id: string
    user_id: string
    product_id?: string
    text: string
    is_checked: boolean
    created_at: string
}

export interface ShoppingListModel {
    id: string
    userId: string
    productId?: string
    text: string
    isChecked: boolean
    createdAt: Date
}

export function shoppingListDtoToModel(dto: ShoppingListDto): ShoppingListModel {
    return {
        id: dto.id,
        userId: dto.user_id,
        productId: dto.product_id,
        text: dto.text,
        isChecked: dto.is_checked,
        createdAt: new Date(dto.created_at)
    }
}

export function shoppingListModelToDto(model: ShoppingListModel): ShoppingListDto {
    return {
        id: model.id,
        user_id: model.userId,
        product_id: model.productId,
        text: model.text,
        is_checked: model.isChecked,
        created_at: model.createdAt.toISOString()
    }
}
