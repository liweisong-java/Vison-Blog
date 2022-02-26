package com.weisong.backend.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Table;

/**
 * @author 李伟松
 * @create 2022-02-26-15:04
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name ="category")
public class Category {
    @Column(name="category_id")
    private Integer categoryId;

    @Column(name="category")
    private String category;
}
