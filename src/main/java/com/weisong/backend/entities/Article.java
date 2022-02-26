package com.weisong.backend.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Table;
import java.util.Date;

/**
 * @author 李伟松
 * @create 2022-02-26-11:40
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name ="article")
public class Article {

    @Column(name="uuid")
    private String uuid;

    @Column(name="title")
    private String title;

    @Column(name="article")
    private String article;

    @Column(name="read")
    private Integer read;

    @Column(name="like")
    private Integer like;

    @Column(name="answer")
    private Integer answer;

    @Column(name="create_date")
    private Date createDate;

    @Column(name="update_date")
    private Date updateDate;

    @Column(name="name")
    private String name;

    @Column(name="category_id")
    private String categoryId;
}
