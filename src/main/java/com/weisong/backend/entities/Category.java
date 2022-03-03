package com.weisong.backend.entities;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
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
@TableName("category")
public class Category {

    @TableId
    @Column(name="category_id")
    private Integer categoryId;

    @Column(name="category")
    private String category;
}
