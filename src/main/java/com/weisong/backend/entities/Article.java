package com.weisong.backend.entities;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.Column;
import javax.persistence.EntityListeners;
import javax.persistence.Table;
import javax.validation.constraints.NotEmpty;
import java.util.Date;

/**
 * @author 李伟松
 * @create 2022-02-26-11:40
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@TableName("article")
public class Article {

    @TableId
    @Column(name="article_uuid")
    private String article_uuid;

    @NotEmpty(message = "标题不能为空")
    @Column(name="title")
    private String title;

    @NotEmpty(message = "文章内容不能为空")
    @Column(name="article")
    private String article;

    @Column(name="read")
    private Integer read;

    @Column(name="like")
    private Integer like;

    @Column(name="answer")
    private Integer answer;

    @CreatedDate
    @Column(name="create_date")
    private Date createDate;

    @LastModifiedDate
    @Column(name="update_date")
    private Date updateDate;

    @Column(name="name")
    private String name;

    @Column(name="category_id")
    private String categoryId;
}
