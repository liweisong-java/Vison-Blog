package com.weisong.backend.entities;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.weisong.backend.util.UuidBuilderUtils;
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
    @TableField(value = "articleUuid")
    private String articleUuid;

    @NotEmpty(message = "标题不能为空")
    @TableField(value = "title")
    private String title;

    @NotEmpty(message = "文章内容不能为空")
    @TableField(value = "article")
    private String article;

    @TableField(value = "read")
    private Integer read;

    @TableField(value = "like")
    private Integer like;

    @TableField(value = "answer")
    private Integer answer;

    @TableField(value = "create_date")
    private Date createDate;

    @TableField(value = "update_date")
    private Date updateDate;

    @TableField(value = "userUuid")
    private String userUuid;

    @TableField(value = "name")
    private String name;

    @TableField(value = "categoryId")
    private String categoryId;


    public String createArticleUuid() {
        return UuidBuilderUtils.createUUID();
    }

}
